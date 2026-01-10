export function checkAdminAccess(request: Request): boolean {
    const adminCode = request.headers.get('x-admin-code');
    return adminCode === process.env.ADMIN_CODE;
}
