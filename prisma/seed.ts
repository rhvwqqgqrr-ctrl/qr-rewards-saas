import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...\n");

  // ─── 1. Platform Super Admin ──────────────────────────
  const platformAdmin = await prisma.platformUser.upsert({
    where: { email: "admin@qrrewards.io" },
    update: {},
    create: {
      email: "admin@qrrewards.io",
      passwordHash: await bcrypt.hash("admin123456", 12),
      name: "Super Admin",
      role: "SUPER_ADMIN",
    },
  });
  console.log("✅ Platform admin created:", platformAdmin.email);

  // ─── 2. Restaurant: Le Pare Faim ─────────────────────
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: "le-pare-faim" },
    update: {},
    create: {
      name: "Le Pare Faim",
      slug: "le-pare-faim",
      logoUrl: null,
      primaryColor: "#d6822e",
      secondaryColor: "#3a1b0e",
      addressLine1: "6 Rue Centrale",
      postalCode: "69360",
      city: "Communay",
      phone: null,
      websiteUrl: "https://leparefaim.fr/fr",
      googleReviewUrl: "https://g.page/r/leparefaim/review",
      timezone: "Europe/Paris",
      status: "ACTIVE",
    },
  });
  console.log("✅ Restaurant created:", restaurant.name);

  // ─── 3. Restaurant Manager ────────────────────────────
  const manager = await prisma.restaurantUser.upsert({
    where: {
      restaurantId_email: {
        restaurantId: restaurant.id,
        email: "manager@leparefaim.fr",
      },
    },
    update: {},
    create: {
      restaurantId: restaurant.id,
      email: "manager@leparefaim.fr",
      passwordHash: await bcrypt.hash("manager123", 12),
      name: "Marie Dupont",
      role: "MANAGER",
      active: true,
    },
  });
  console.log("✅ Manager created:", manager.email);

  // ─── 4. Restaurant Staff ──────────────────────────────
  const staff = await prisma.restaurantUser.upsert({
    where: {
      restaurantId_email: {
        restaurantId: restaurant.id,
        email: "staff@leparefaim.fr",
      },
    },
    update: {},
    create: {
      restaurantId: restaurant.id,
      email: "staff@leparefaim.fr",
      passwordHash: await bcrypt.hash("staff12345", 12),
      name: "Lucas Martin",
      role: "STAFF",
      active: true,
    },
  });
  console.log("✅ Staff created:", staff.email);

  // ─── 5. Campaign ──────────────────────────────────────
  const campaign = await prisma.campaign.upsert({
    where: {
      restaurantId_slug: {
        restaurantId: restaurant.id,
        slug: "bienvenue-2026",
      },
    },
    update: {},
    create: {
      restaurantId: restaurant.id,
      name: "Bienvenue 2026",
      slug: "bienvenue-2026",
      description: "Tentez votre chance et gagnez des récompenses chez Le Pare Faim !",
      status: "ACTIVE",
      startsAt: new Date("2026-01-01T00:00:00+01:00"),
      endsAt: new Date("2026-12-31T23:59:59+01:00"),
      termsText: "Offre valable une fois par personne et par jour. Gain à utiliser lors d'une prochaine visite.",
      privacyText: "Aucune donnée personnelle n'est collectée.",
    },
  });
  console.log("✅ Campaign created:", campaign.name);

  // ─── 6. Prizes ────────────────────────────────────────
  const prizes = [
    {
      type: "FREE_PRODUCT" as const,
      label: "Café offert",
      description: "Un café offert lors de votre prochaine visite",
      weight: 20,
      displayOrder: 1,
    },
    {
      type: "FREE_PRODUCT" as const,
      label: "Soft offert",
      description: "Une boisson soft offerte lors de votre prochaine visite",
      weight: 15,
      displayOrder: 2,
    },
    {
      type: "DISCOUNT_PERCENT" as const,
      label: "Remise 5%",
      description: "5% de réduction sur votre prochaine addition",
      weight: 10,
      percentValue: 5,
      displayOrder: 3,
    },
    {
      type: "DISCOUNT_PERCENT" as const,
      label: "Remise 10%",
      description: "10% de réduction sur votre prochaine addition",
      weight: 5,
      percentValue: 10,
      displayOrder: 4,
    },
    {
      type: "NO_PRIZE" as const,
      label: "Pas de chance",
      description: "Retentez votre chance une prochaine fois !",
      weight: 50,
      displayOrder: 5,
    },
  ];

  for (const prizeData of prizes) {
    await prisma.prize.create({
      data: {
        campaignId: campaign.id,
        ...prizeData,
        active: true,
        cumulativeAllowed: false,
      },
    });
  }
  console.log("✅ 5 prizes created (20/15/10/5/50 weights)");

  // ─── 7. Public QR ────────────────────────────────────
  const qrSlug = `le-pare-faim-bienvenue-2026-${crypto.randomBytes(4).toString("hex")}`;
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  const publicQr = await prisma.publicQr.create({
    data: {
      campaignId: campaign.id,
      slug: qrSlug,
      label: "QR Table Principal",
      targetUrl: `${appUrl}/play/le-pare-faim/bienvenue-2026?qr=${qrSlug}`,
      metadata: { location: "table", zone: "salle principale" },
      active: true,
    },
  });
  console.log("✅ Public QR created:", publicQr.slug);

  // ─── Summary ──────────────────────────────────────────
  console.log("\n🎉 Seed complete!\n");
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║  CREDENTIALS SUMMARY                        ║");
  console.log("╠══════════════════════════════════════════════╣");
  console.log("║  Platform Admin:                            ║");
  console.log("║    Email: admin@qrrewards.io                ║");
  console.log("║    Pass:  admin123456                       ║");
  console.log("║                                             ║");
  console.log("║  Restaurant Manager:                        ║");
  console.log("║    Email: manager@leparefaim.fr             ║");
  console.log("║    Pass:  manager123                        ║");
  console.log("║                                             ║");
  console.log("║  Restaurant Staff:                          ║");
  console.log("║    Email: staff@leparefaim.fr               ║");
  console.log("║    Pass:  staff12345                        ║");
  console.log("║    Slug:  le-pare-faim                      ║");
  console.log("║                                             ║");
  console.log("║  Public Play URL:                           ║");
  console.log(`║  ${appUrl}/play/le-pare-faim/bienvenue-2026`);
  console.log("╚══════════════════════════════════════════════╝");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
