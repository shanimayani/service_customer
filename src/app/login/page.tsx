import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl border border-stone-300 p-6">
        <h1 className="text-xl font-bold mb-1">התחברות</h1>
        <p className="text-stone-500 text-sm mb-6">מוקד פניות · פרקטי</p>

        {error && (
          <p className="text-red-600 bg-red-50 rounded-lg p-3 mb-4 text-sm">
            פרטי התחברות שגויים
          </p>
        )}

        <form action={login} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-stone-600 mb-1">
              אימייל
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm text-stone-600 mb-1">
              סיסמה
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-stone-800 text-white hover:bg-stone-700"
          >
            התחברות
          </button>
        </form>
      </div>
    </main>
  );
}
