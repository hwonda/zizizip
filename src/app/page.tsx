import { redirect } from 'next/navigation';

export default function Home() {
  // 홈 페이지 접속 시 대시보드로 리다이렉트
  redirect('/map');
}