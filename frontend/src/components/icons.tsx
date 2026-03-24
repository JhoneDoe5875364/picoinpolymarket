import type { SVGProps } from "react";

export function PiPredictLogo(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M9 4h6a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5H9" />
            <path d="M9 9h6" />
            <path d="M12 14v6" />
        </svg>
    );
}
