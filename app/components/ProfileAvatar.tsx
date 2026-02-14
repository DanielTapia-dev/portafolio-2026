import Image from 'next/image';

type ProfileAvatarProps = {
  src: string;
  alt: string;
};

export default function ProfileAvatar({src, alt}: ProfileAvatarProps) {
  return (
    <div className="flex justify-center">
      <div className="relative w-64 h-64 rounded-full overflow-hidden border border-border shadow-sm">
        <Image src={src} alt={alt} fill priority className="object-cover" />
      </div>
    </div>
  );
}
