CREATE TABLE "welcomed_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"user_id" text NOT NULL,
	"username" text NOT NULL,
	"welcomed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile_customizations" ADD COLUMN "background_gradient" text;--> statement-breakpoint
ALTER TABLE "profile_customizations" ADD COLUMN "background_blur" integer;--> statement-breakpoint
ALTER TABLE "profile_customizations" ADD COLUMN "name_font_size" text;--> statement-breakpoint
ALTER TABLE "profile_customizations" ADD COLUMN "name_gradient" text;--> statement-breakpoint
ALTER TABLE "profile_customizations" ADD COLUMN "name_glow_color" text;--> statement-breakpoint
ALTER TABLE "profile_customizations" ADD COLUMN "name_animation" text;--> statement-breakpoint
ALTER TABLE "profile_customizations" ADD COLUMN "avatar_glow_color" text;--> statement-breakpoint
ALTER TABLE "profile_customizations" ADD COLUMN "avatar_glow_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "profile_customizations" ADD COLUMN "profile_effect" text;--> statement-breakpoint
ALTER TABLE "profile_customizations" ADD COLUMN "profile_intro" text;--> statement-breakpoint
ALTER TABLE "profile_customizations" ADD COLUMN "show_pnl" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "profile_customizations" ADD COLUMN "show_notes" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "profile_customizations" ADD COLUMN "is_profile_public" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "server_settings" ADD COLUMN "welcome_role_id" text;--> statement-breakpoint
ALTER TABLE "server_settings" ADD COLUMN "welcome_message" text;--> statement-breakpoint
ALTER TABLE "server_settings" ADD COLUMN "last_bible_sent" timestamp;