import { z } from "zod";

import {
  supabaseAdmin,
  supabasePublic,
} from "../config/supabase.js";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("A valid email address is required."),

  password: z
    .string()
    .min(6, "Password is required."),
});

function formatUser(authUser, profile) {
  return {
    id: authUser.id,
    email: authUser.email,

    fullName:
      profile?.full_name ||
      authUser.user_metadata?.full_name ||
      "",

    role: profile?.role || "viewer",
    status: profile?.status || "inactive",

    avatarUrl:
      profile?.avatar_url || null,

    lastLoginAt:
      profile?.last_login_at || null,
  };
}

export async function login(
  request,
  response,
  next
) {
  try {
    const input = loginSchema.parse(
      request.body
    );

    const {
      data: authData,
      error: authError,
    } =
      await supabasePublic.auth.signInWithPassword({
        email: input.email.toLowerCase(),
        password: input.password,
      });

    if (
      authError ||
      !authData.user ||
      !authData.session
    ) {
      return response.status(401).json({
        success: false,
        message:
          "Invalid email address or password.",
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
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile) {
      return response.status(403).json({
        success: false,
        message:
          "Your application profile could not be found.",
      });
    }

    if (profile.status !== "active") {
      return response.status(403).json({
        success: false,
        message:
          "Your account is not active. Contact an administrator.",
      });
    }

    const now = new Date().toISOString();

    await supabaseAdmin
      .from("profiles")
      .update({
        last_login_at: now,
      })
      .eq("id", profile.id);

    await supabaseAdmin
      .from("audit_logs")
      .insert({
        user_id: profile.id,
        action: "auth.login",
        entity_type: "user",
        entity_id: profile.id,

        metadata: {
          email: profile.email,
          role: profile.role,
        },

        ip_address:
          request.ip || null,

        user_agent:
          request.headers["user-agent"] ||
          null,
      });

    response.json({
      success: true,
      message: "Login successful.",

      data: {
        user: formatUser(
          authData.user,
          {
            ...profile,
            last_login_at: now,
          }
        ),

        session: {
          accessToken:
            authData.session.access_token,

          refreshToken:
            authData.session.refresh_token,

          expiresAt:
            authData.session.expires_at,

          expiresIn:
            authData.session.expires_in,

          tokenType:
            authData.session.token_type,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUser(
  request,
  response,
  next
) {
  try {
    response.json({
      success: true,

      data: {
        user: {
          id: request.authUser.id,
          email: request.authUser.email,

          fullName:
            request.profile.full_name ||
            "",

          role:
            request.profile.role,

          status:
            request.profile.status,

          avatarUrl:
            request.profile.avatar_url ||
            null,

          lastLoginAt:
            request.profile.last_login_at ||
            null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function refreshSession(
  request,
  response,
  next
) {
  try {
    const refreshToken = String(
      request.body?.refreshToken || ""
    ).trim();

    if (!refreshToken) {
      return response.status(400).json({
        success: false,
        message:
          "Refresh token is required.",
      });
    }

    const {
      data,
      error,
    } =
      await supabasePublic.auth.refreshSession({
        refresh_token: refreshToken,
      });

    if (
      error ||
      !data.session ||
      !data.user
    ) {
      return response.status(401).json({
        success: false,
        message:
          "Session could not be refreshed.",
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
      .eq("id", data.user.id)
      .single();

    if (
      profileError ||
      !profile ||
      profile.status !== "active"
    ) {
      return response.status(403).json({
        success: false,
        message:
          "Your account is not active.",
      });
    }

    response.json({
      success: true,

      data: {
        user: formatUser(
          data.user,
          profile
        ),

        session: {
          accessToken:
            data.session.access_token,

          refreshToken:
            data.session.refresh_token,

          expiresAt:
            data.session.expires_at,

          expiresIn:
            data.session.expires_in,

          tokenType:
            data.session.token_type,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(
  request,
  response,
  next
) {
  try {
    if (request.profile?.id) {
      await supabaseAdmin
        .from("audit_logs")
        .insert({
          user_id: request.profile.id,
          action: "auth.logout",
          entity_type: "user",
          entity_id: request.profile.id,

          metadata: {
            email:
              request.profile.email,
            role:
              request.profile.role,
          },

          ip_address:
            request.ip || null,

          user_agent:
            request.headers[
              "user-agent"
            ] || null,
        });
    }

    response.json({
      success: true,
      message: "Logout successful.",
    });
  } catch (error) {
    next(error);
  }
}