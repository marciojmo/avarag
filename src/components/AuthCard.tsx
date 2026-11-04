import Link from "next/link";
import GoogleSignInButton from "./GoogleSignInButton";

type AuthCardProps = {
    title: string;
    buttonLabel?: string;
    error?: string;
    footer: { prompt: string; href: string; linkLabel: string };
};

// Centered sign-in / sign-up card shared by /login and /signup.
export default function AuthCard({ title, buttonLabel, error, footer }: AuthCardProps) {
    return (
        <main className="min-h-full flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md rounded-[28px] bg-surface-container-low px-6 py-10 sm:px-10 text-center">
                <span className="mx-auto mb-6 flex items-center justify-center w-14 h-14 rounded-2xl bg-brand text-on-brand">
                    <span className="md-icon md-icon--filled" aria-hidden="true">
                        forum
                    </span>
                </span>
                <h1 className="headline-small text-on-surface mb-2">{title}</h1>
                <p className="body-medium text-on-surface-variant mb-8">
                    Upload your documents and chat with them.
                </p>

                {error && (
                    <p
                        role="alert"
                        className="mb-6 flex items-start gap-3 text-left rounded-xl bg-error-container text-on-error-container body-medium p-4"
                    >
                        <span className="md-icon md-icon--sm mt-px" aria-hidden="true">
                            error
                        </span>
                        {error}
                    </p>
                )}

                <GoogleSignInButton label={buttonLabel} />

                <p className="mt-8 body-medium text-on-surface-variant">
                    {footer.prompt}{" "}
                    <Link
                        href={footer.href}
                        className="label-large text-primary underline-offset-4 hover:underline focus-visible:underline"
                    >
                        {footer.linkLabel}
                    </Link>
                </p>
            </div>
        </main>
    );
}
