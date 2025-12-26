import Header from '../components/Header';

export default function layout({children}: {children: React.ReactNode}) {
  return (
    <div className="mx-50">
      <main className="flex flex-col items-center p-24">
        <span className="text-2xl">Hola Mundo!</span>
        {children}
      </main>
    </div>
  );
}
