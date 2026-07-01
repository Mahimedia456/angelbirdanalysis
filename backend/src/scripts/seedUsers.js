import { supabaseAdmin } from "../config/supabase.js";

const DEFAULT_PASSWORD =
  "Mahimediasolutions@786";

const users = [
  {
    email: "aamir@mahimediasolutions.com",
    fullName: "Aamir",
    role: "owner",
  },
  {
    email: "shahid@mahimediasolutions.com",
    fullName: "Shahid",
    role: "admin",
  },
  {
    email: "angelbird@mahimediasolutions.com",
    fullName: "Angelbird Analyst",
    role: "analyst",
  },
  {
    email: "angelbird2@mahimediasolutions.com",
    fullName: "Angelbird Viewer",
    role: "viewer",
  },
];

async function findUserByEmail(email) {
  let page = 1;
  const perPage = 100;

  while (true) {
    const {
      data,
      error,
    } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) throw error;

    const found = data.users.find(
      (user) =>
        String(user.email || "").toLowerCase() ===
        email.toLowerCase()
    );

    if (found) return found;

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

async function createOrUpdateUser(userConfig) {
  let authUser = await findUserByEmail(
    userConfig.email
  );

  if (!authUser) {
    const {
      data,
      error,
    } =
      await supabaseAdmin.auth.admin.createUser({
        email: userConfig.email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,

        user_metadata: {
          full_name: userConfig.fullName,
        },
      });

    if (error) throw error;

    authUser = data.user;

    console.log(
      `Created auth user: ${userConfig.email}`
    );
  } else {
    const { error } =
      await supabaseAdmin.auth.admin.updateUserById(
        authUser.id,
        {
          password: DEFAULT_PASSWORD,
          email_confirm: true,

          user_metadata: {
            full_name: userConfig.fullName,
          },
        }
      );

    if (error) throw error;

    console.log(
      `Updated auth user: ${userConfig.email}`
    );
  }

  const { error: profileError } =
    await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: authUser.id,
          email: userConfig.email.toLowerCase(),
          full_name: userConfig.fullName,
          role: userConfig.role,
          status: "active",
        },
        {
          onConflict: "id",
        }
      );

  if (profileError) {
    throw profileError;
  }

  console.log(
    `Assigned role ${userConfig.role}: ${userConfig.email}`
  );
}

async function seedUsers() {
  try {
    for (const user of users) {
      await createOrUpdateUser(user);
    }

    console.log("");
    console.log(
      "Angelbird users seeded successfully."
    );

    console.table(
      users.map((user) => ({
        email: user.email,
        role: user.role,
        password: DEFAULT_PASSWORD,
      }))
    );
  } catch (error) {
    console.error(
      "User seed failed:",
      error.message
    );

    process.exitCode = 1;
  }
}

seedUsers();