
const generateGuid = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
        //console.log(guid);
    } else {
        //console.log("crypto.randomUUID is not supported in this environment");
        //fallback to another method.
        return "";
    }
}

export { generateGuid }