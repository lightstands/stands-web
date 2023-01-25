export default function () {
    return !!(navigator.permissions && navigator.permissions.query);
}
