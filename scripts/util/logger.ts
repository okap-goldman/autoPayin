const formatDate = (date: Date) => {
    return `${date.getFullYear()}-${
        date.getMonth() + 1
    }-${date.getDate()} ${date.getHours()}:${date.getMinutes()} ${date.getSeconds()}`;
};

export const getNowDate = () => {
    const date = new Date();
    return formatDate(date);
};

export const debugLog = (
    text: string | unknown,
    ...optionalParams: string[]
) => {
    // tslint:disable-next-line:no-console
    console.log(`[ ${getNowDate()} ] ${text}`, ...optionalParams);
};

export const debugDetailLog = (
    text: string | unknown,
    ...optionalParams: string[]
) => {
    // tslint:disable-next-line:no-console
    console.log(
        `[ ${getNowDate()} ] ${text} @ ${new Error().stack}`,
        ...optionalParams
    );
};
