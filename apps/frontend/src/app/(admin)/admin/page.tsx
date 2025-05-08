import { redirect } from 'next/navigation'

const AdminPage = () => {
  return redirect("/admin/users")
}

export default AdminPage
