import { SignInButton, SignUpButton } from '@clerk/clerk-react';

const buttonClassName =
  'inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-medium transition-transform duration-200 hover:-translate-y-0.5';

const Home = () => {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#dff1de_0%,#f6faf5_45%,#eef3ec_100%)] px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center justify-center">
        <section className="w-full rounded-[32px] border border-white/70 bg-white/75 px-6 py-14 text-center shadow-[0px_24px_60px_rgba(47,51,49,0.12)] backdrop-blur-sm sm:px-10">
          <p className="typography-body-sm tracking-[0.3em] text-[#005412] uppercase">
            Kidsfeed
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight text-[#0f5f1f] sm:text-7xl">
            Welcome to Kidsfeed
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#4f5a4d] sm:text-xl">
            Sign in to manage meals, inventory, schools, and planning from one
            place.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <SignInButton mode="modal">
              <button
                type="button"
                className={`${buttonClassName} min-w-40 bg-[#005412] text-white shadow-[0px_10px_24px_rgba(0,84,18,0.22)] hover:bg-[#00460f]`}
              >
                Sign in
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button
                type="button"
                className={`${buttonClassName} min-w-40 border border-[#cbd7c7] bg-white text-[#0f5f1f] hover:border-[#005412] hover:bg-[#f4faf3]`}
              >
                Sign up
              </button>
            </SignUpButton>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Home;
