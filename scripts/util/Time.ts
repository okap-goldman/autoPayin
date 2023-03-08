export const convertDateToString = (date: Date) => {
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
};

export const sleep = async(ms: number) : Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => resolve(), ms);
    });
};
