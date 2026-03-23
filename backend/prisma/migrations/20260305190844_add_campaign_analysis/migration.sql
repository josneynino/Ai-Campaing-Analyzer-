-- CreateTable
CREATE TABLE "Campaign" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "originalText" TEXT NOT NULL,
    "originalUrl" TEXT,
    "nicheDetected" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Campaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Analysis" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "campaignId" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "clarityScore" INTEGER NOT NULL,
    "persuasionScore" INTEGER NOT NULL,
    "differentiationScore" INTEGER NOT NULL,
    "ctaScore" INTEGER NOT NULL,
    "conversionScore" INTEGER NOT NULL,
    "recommendations" TEXT NOT NULL,
    "optimizedVersion" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Analysis_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
