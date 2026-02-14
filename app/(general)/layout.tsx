export default function layout({children}: {children: React.ReactNode}) {
  return (
    <div className="mx-50">
      <main className="flex flex-col items-center">{children}</main>
    </div>
  );
}
