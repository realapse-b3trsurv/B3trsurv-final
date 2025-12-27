import { db } from "./db";
import { badges } from "@shared/schema";

const PREDEFINED_BADGES = [
  {
    name: "First Steps",
    description: "Complete your first 5 surveys",
    icon: "star",
    tier: "bronze",
    requiredSurveys: 5,
  },
  {
    name: "Survey Explorer",
    description: "Complete 10 surveys",
    icon: "award",
    tier: "bronze",
    requiredSurveys: 10,
  },
  {
    name: "Data Contributor",
    description: "Complete 25 surveys",
    icon: "trophy",
    tier: "silver",
    requiredSurveys: 25,
  },
  {
    name: "Survey Master",
    description: "Complete 50 surveys",
    icon: "medal",
    tier: "silver",
    requiredSurveys: 50,
  },
  {
    name: "Elite Researcher",
    description: "Complete 100 surveys",
    icon: "crown",
    tier: "gold",
    requiredSurveys: 100,
  },
];

async function seedBadges() {
  console.log("Seeding badges...");
  
  for (const badge of PREDEFINED_BADGES) {
    await db.insert(badges).values(badge).onConflictDoNothing();
  }
  
  console.log("Badges seeded successfully!");
  process.exit(0);
}

seedBadges().catch((error) => {
  console.error("Error seeding badges:", error);
  process.exit(1);
});
