import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M20 2L36 11V29L20 38L4 29V11L20 2ZM20 6.5L30.5 12.5V24.5L20 30.5L9.5 24.5V12.5L20 6.5ZM20 10.5L26 14V21.5L20 25.5L14 21.5V14L20 10.5Z"
            />
            <path d="M20 25L26 21V14L20 17.5L14 14V21L20 25Z" opacity="0.6" />
        </svg>
    );
}
