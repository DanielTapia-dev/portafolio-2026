import Image from 'next/image';

type ProfileAvatarProps = {
  src: string;
  alt: string;
};

export default function ProfileAvatar({src, alt}: ProfileAvatarProps) {
  return (
    <div className="relative mx-auto h-40 w-40">
      {/* Soft glow behind a gradient ring. */}
      <div className="absolute -inset-3 rounded-full bg-primary/25 blur-2xl" />
      <div className="relative h-full w-full rounded-full bg-gradient-to-br from-primary via-sky-500/60 to-transparent p-[3px]">
        <div className="relative h-full w-full overflow-hidden rounded-full bg-background">
          <Image
            src={src}
            alt={alt}
            fill
            priority
            sizes="160px"
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
}
