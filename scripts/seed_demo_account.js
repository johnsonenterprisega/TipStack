const { createClient } = require("@supabase/supabase-js");

const url = "https://eosbtwubpzoogpvajyyk.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvc2J0d3VicHpvb2dwdmFqeXlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0MDkxMjgsImV4cCI6MjEwMjk4NTEyOH0.elGLlBOARK-B41GoftUCFeDSgJ7788oWqHdG3CxEdUI";
const supabase = createClient(url, key);

const DEMO_EMAIL = "shopfastapparel+reviewer@gmail.com";
const DEMO_PASS = "StackUpReview2026!";

async function main() {
  console.log(`Checking status for ${DEMO_EMAIL}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASS,
  });

  if (authError) {
    console.log("Sign-in failed:", authError.message);
    if (authError.message.includes("Email not confirmed")) {
      console.log("\n⚠️ ACTION NEEDED:");
      console.log("Supabase sent a confirmation link to shopfastapparel@gmail.com.");
      console.log("Please check your Gmail inbox and click the 'Confirm your email' button!");
    }
    return;
  }

  const user = authData.user;
  console.log("✅ Authenticated as demo user:", user.id);

  // 1. Update Profile
  console.log("Configuring demo profile...");
  await supabase
    .from("profiles")
    .update({
      username: "Apple Reviewer",
      pay_period_start_day: 3, // Wednesday
      pay_day: 5, // Friday
    })
    .eq("id", user.id);

  // 2. Check or Create Jobs
  console.log("Configuring demo workplaces...");
  const { data: existingJobs } = await supabase
    .from("jobs")
    .select("id, name")
    .eq("user_id", user.id);

  let job1Id, job2Id;
  if (!existingJobs || existingJobs.length === 0) {
    const { data: newJobs, error: jobErr } = await supabase.from("jobs").insert([
      {
        user_id: user.id,
        name: "Cabernet",
        role: "Server Dinner",
        hourly_wage: 4.25,
        tip_out_percent: 22.3,
        color: "#10B981",
        is_active: true,
      },
      {
        user_id: user.id,
        name: "Primary Job",
        role: "Server / Bartender",
        hourly_wage: 5.0,
        tip_out_percent: 15.0,
        color: "#06B6D4",
        is_active: true,
      },
    ]).select();

    if (jobErr) {
      console.error("Error creating jobs:", jobErr);
      return;
    }
    job1Id = newJobs[0].id;
    job2Id = newJobs[1].id;
    console.log("Created jobs:", newJobs.map(j => j.name));
  } else {
    job1Id = existingJobs[0].id;
    job2Id = existingJobs.length > 1 ? existingJobs[1].id : job1Id;
    console.log("Jobs already exist:", existingJobs.map(j => j.name));
  }

  // 3. Populate Sample Shifts
  const { data: existingShifts } = await supabase
    .from("shifts")
    .select("id")
    .eq("user_id", user.id);

  if (!existingShifts || existingShifts.length === 0) {
    console.log("Populating sample shifts...");
    const sampleShifts = [
      {
        user_id: user.id,
        job_id: job1Id,
        date: "2026-10-05",
        hours_worked: 5.0,
        cash_tips: 10.0,
        credit_tips: 140.48,
        tip_out_amount: 32.23,
        notes: "Great dinner rush!",
      },
      {
        user_id: user.id,
        job_id: job1Id,
        date: "2026-10-04",
        hours_worked: 6.0,
        cash_tips: 25.0,
        credit_tips: 199.0,
        tip_out_amount: 45.0,
        notes: "Sunday night patio",
      },
      {
        user_id: user.id,
        job_id: job2Id,
        date: "2026-10-02",
        hours_worked: 5.5,
        cash_tips: 15.0,
        credit_tips: 175.0,
        tip_out_amount: 35.0,
        notes: "Friday prime shift",
      },
      {
        user_id: user.id,
        job_id: job1Id,
        date: "2026-09-29",
        hours_worked: 5.0,
        cash_tips: 20.0,
        credit_tips: 120.0,
        tip_out_amount: 25.0,
      },
      {
        user_id: user.id,
        job_id: job1Id,
        date: "2026-09-28",
        hours_worked: 6.0,
        cash_tips: 30.0,
        credit_tips: 180.0,
        tip_out_amount: 38.0,
      },
      {
        user_id: user.id,
        job_id: job2Id,
        date: "2026-09-25",
        hours_worked: 5.0,
        cash_tips: 15.0,
        credit_tips: 165.0,
        tip_out_amount: 30.0,
      },
    ];

    const { error: shiftErr } = await supabase.from("shifts").insert(sampleShifts);
    if (shiftErr) {
      console.error("Error inserting sample shifts:", shiftErr);
    } else {
      console.log(`✅ Successfully seeded ${sampleShifts.length} sample shifts!`);
    }
  } else {
    console.log(`Shifts already seeded (${existingShifts.length} shifts).`);
  }

  console.log("\n🎉 Demo Account Setup Complete!");
  console.log("Credentials for Apple App Review:");
  console.log(`Email:    ${DEMO_EMAIL}`);
  console.log(`Password: ${DEMO_PASS}`);
}

main();
