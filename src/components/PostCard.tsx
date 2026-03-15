"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PostListItem } from "@/lib/data";

interface PostCardProps {
    post: PostListItem;
    variant?: "compact" | "default";
    blurSize?: string;
    blurOpacity?: number;
    backdropBlur?: string;
    imageSize?: string;
    className?: string;
}

const DEFAULTS = {
    blurSize: "blur-xl",
    blurOpacity: 0.18,
    backdropBlur: "backdrop-blur-2xl",
    imageSize: {
        compact: "w-16 h-16 sm:w-20 sm:h-20",
        default: "w-full sm:w-28 lg:w-32 aspect-square",
    },
} as const;

// Tailwind safelist to ensure dynamic hover classes are compiled
// hover:backdrop-blur-sm hover:backdrop-blur-md hover:backdrop-blur-lg hover:backdrop-blur-xl hover:backdrop-blur-2xl hover:backdrop-blur-3xl

export default function PostCard({
    post,
    variant = "default",
    blurSize = DEFAULTS.blurSize,
    blurOpacity = DEFAULTS.blurOpacity,
    backdropBlur = DEFAULTS.backdropBlur,
    imageSize,
    className: outerClassName,
}: PostCardProps) {
    const isCompact = variant === "compact";
    const resolvedImageSize = imageSize ?? DEFAULTS.imageSize[variant];

    return (
        <article className={cn("relative z-0 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both", outerClassName)}>
            <Link
                href={`/posts/${post.id}`}
                className={cn(
                    "group relative block transition-all duration-500 active:scale-[0.98] overflow-hidden border border-transparent hover:border-white/5 hover:shadow-2xl",
                    isCompact ? "py-2 px-3.5 rounded-xl" : "p-4 sm:p-5 rounded-3xl -mx-4 sm:-mx-5",
                    post.image
                        ? `hover:bg-muted/40 hover:${backdropBlur}`
                        : "hover:bg-muted/50"
                )}
            >
                {post.image && (
                    <div
                        className={cn(
                            "absolute inset-0 -z-10 saturate-150 transition-opacity duration-700 scale-110 pointer-events-none opacity-0 group-hover:opacity-[var(--blur-opacity)]",
                            blurSize,
                        )}
                        style={{
                            backgroundImage: `url(${post.image})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            "--blur-opacity": blurOpacity,
                        } as React.CSSProperties}
                    />
                )}

                <div className={cn(
                    "flex gap-3.5",
                    isCompact ? "flex-row items-center" : "flex-col sm:flex-row sm:gap-5 sm:items-center"
                )}>
                    <div className="flex-1 space-y-1.5">
                        {!isCompact && (
                            <div className="flex flex-wrap gap-1.5 mb-1">
                                {post.category.map((cat, idx) => (
                                    <span key={`${post.id}-${cat}`} className="text-[12px] font-bold text-primary">
                                        {cat}
                                        {idx < post.category.length - 1 ? (
                                            <span className="text-muted-foreground ml-1.5">•</span>
                                        ) : (
                                            ""
                                        )}
                                    </span>
                                ))}
                            </div>
                        )}

                        {isCompact && (
                            <div className="flex flex-wrap gap-1.5 mb-0.5">
                                {post.category.map((cat) => (
                                    <span key={`${post.id}-${cat}`} className="text-[11px] font-bold text-primary">
                                        {cat}
                                    </span>
                                ))}
                            </div>
                        )}

                        <h3 className={cn(
                            "font-bold tracking-tight text-foreground group-hover:text-primary transition-colors duration-200",
                            isCompact ? "text-[16px] sm:text-[17px]" : "text-xl"
                        )}>
                            {post.title}
                        </h3>

                        {!isCompact && (
                            <p className="text-[15px] text-muted-foreground/90 line-clamp-2 leading-relaxed">
                                {post.excerpt}
                            </p>
                        )}

                        <time
                            dateTime={post.date.replace(/\./g, "-")}
                            className={cn(
                                "inline-block font-medium text-muted-foreground/60 shrink-0 font-mono",
                                isCompact ? "text-[12px]" : "text-[13px]"
                            )}
                        >
                            {isCompact ? post.date.substring(5) : post.date}
                        </time>
                    </div>

                    {post.image && (
                        <div className={cn(
                            "relative z-0 shrink-0 rounded-2xl overflow-hidden border border-border/50 shadow-2xl group-hover:border-primary/30 transition-all duration-500 pointer-events-none",
                            resolvedImageSize,
                        )}>
                            <Image
                                src={post.image}
                                className="object-cover group-hover:scale-110 transition-transform duration-700 pointer-events-none"
                                alt={post.title}
                                fill
                                sizes={isCompact ? "80px" : "(max-width: 640px) 100vw, 128px"}
                            />
                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    )}
                </div>
            </Link>
        </article>
    );
}
