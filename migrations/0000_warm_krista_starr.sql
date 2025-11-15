CREATE TABLE "access_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"user_id" text NOT NULL,
	"username" text NOT NULL,
	"avatar_url" text,
	"roles" text[],
	"has_required_role" boolean DEFAULT false NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "access_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "access_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"username" text NOT NULL,
	"trading_experience" text NOT NULL,
	"is_profitable" text NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_knowledge" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"added_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bot_knowledge_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"username" text NOT NULL,
	"channel_id" text NOT NULL,
	"guild_id" text NOT NULL,
	"user_message" text NOT NULL,
	"bot_response" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learned_facts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"username" text NOT NULL,
	"fact_type" text NOT NULL,
	"fact_key" text NOT NULL,
	"fact_value" text NOT NULL,
	"confidence" integer DEFAULT 1 NOT NULL,
	"learned_from" text NOT NULL,
	"guild_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_customizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"background_image" text,
	"background_color" text,
	"overlay_color" text,
	"overlay_opacity" integer,
	"name_font" text,
	"name_color" text,
	"gallery_display" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profile_customizations_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "server_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"bible_channel_id" text,
	"news_channel_id" text,
	"vc_trigger_channel_id" text,
	"vc_category_id" text,
	"request_required_role_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "server_settings_guild_id_unique" UNIQUE("guild_id")
);
--> statement-breakpoint
CREATE TABLE "temp_voice_channels" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"owner_name" text NOT NULL,
	"guild_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "temp_voice_channels_channel_id_unique" UNIQUE("channel_id")
);
--> statement-breakpoint
CREATE TABLE "trade_recaps" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"username" text NOT NULL,
	"notes" text NOT NULL,
	"pnl" text NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
