import { useAppSelector } from '@/store';
import React, { useEffect } from 'react'
import { Outlet, useNavigate } from '@/lib/router-compat'

function AdminProtector() {
    const { user } = useAppSelector((state: any) => state.userState);
    const navigate =  useNavigate()
    useEffect(() => {
      

        if (!user || !['SUPERADMIN', 'ADMIN', 'MANAGER', 'VETERINARIAN'].includes(user.role)) {
            navigate('/login');
        }
        
    }, [user, navigate]);

  return (
    <div><Outlet /></div>
  )
}

export default AdminProtector