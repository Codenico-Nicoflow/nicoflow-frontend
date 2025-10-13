import { Link } from 'react-router-dom';

export default function BottomText({ type }: { type: 'login' | 'register' }) {
  return (
    <div className="flex justify-center items-center w-full mt-4">
      {type === 'login' ? (
        <>
          <p className="text-sm text-muted-foreground mr-1">Don't have an account? </p>
          <Link className="text-sm text-primary hover:underline hover:text-primary/80" to="/sign-up">
            Sign up
          </Link>
        </>
      ) : type === 'register' ? (
        <>
          <p className="text-sm text-muted-foreground mr-1">Already have an account? </p>
          <Link className="text-sm text-primary hover:underline hover:text-primary/80" to="/sign-in">
            Sign in
          </Link>
        </>
      ) : null}
    </div>
  );
}
