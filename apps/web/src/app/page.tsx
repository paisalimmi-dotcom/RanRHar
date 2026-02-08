import { redirect } from 'next/navigation';

/**
 * หน้าแรก redirect ไปเมนูโดยตรง — ลูกค้าเห็นเมนูทันทีเมื่อเปิดแอป
 * เจ้าหน้าที่เข้า /staff เพื่อเข้าสู่ระบบหรือจัดการออเดอร์
 */
export default function Home() {
    redirect('/menu/A12');
}
