export const classNames = (...args) => {
    return args.flat().filter(Boolean).join(' ');
};