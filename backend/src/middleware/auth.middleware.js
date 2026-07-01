import {
  createUserScopedSupabase,
  supabaseAdmin,
} from "../config/supabase.js";

function getBearerToken(request) {
  const authorization =
    request.headers.authorization || "";

  if (
    !authorization.startsWith(
      "Bearer "
    )
  ) {
    return null;
  }

  return authorization
    .slice(7)
    .trim();
}

export async function requireAuth(
  request,
  response,
  next
) {
  try {
    const token =
      getBearerToken(request);

    if (!token) {
      return response.status(401).json({
        success: false,
        message:
          "Authentication is required.",
      });
    }

    const {
      data: { user },
      error,
    } =
      await supabaseAdmin.auth.getUser(
        token
      );

    if (error || !user) {
      return response.status(401).json({
        success: false,
        message:
          "Your session is invalid or has expired.",
      });
    }

    const {
      data: profile,
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        email,
        full_name,
        role,
        status,
        avatar_url,
        last_login_at
      `)
      .eq("id", user.id)
      .single();

    if (
      profileError ||
      !profile
    ) {
      return response.status(403).json({
        success: false,
        message:
          "Your application profile was not found.",
      });
    }

    if (
      profile.status !== "active"
    ) {
      return response.status(403).json({
        success: false,
        message:
          "Your account is not active.",
      });
    }

    request.accessToken = token;
    request.authUser = user;
    request.profile = profile;

    request.supabase =
      createUserScopedSupabase(token);

    next();
  } catch (error) {
    next(error);
  }
}

export function allowRoles(
  ...allowedRoles
) {
  return function roleMiddleware(
    request,
    response,
    next
  ) {
    const role =
      request.profile?.role;

    if (
      !role ||
      !allowedRoles.includes(role)
    ) {
      return response.status(403).json({
        success: false,
        message:
          "You do not have permission to perform this action.",
      });
    }

    next();
  };
}