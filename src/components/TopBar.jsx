import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Home' },
  { to: '/pokemon', label: '원준' },
  { to: '/jaebin', label: '재빈' },
  { to: '/chaewoo', label: '채우' },
  { to: '/yujeong', label: '유정' },
];

function navClass({ isActive }) {
  return `rounded-[10px] border px-2.5 py-2 text-sm transition ${
    isActive
      ? 'border-white/20 bg-white/12 text-white'
      : 'border-transparent text-white/85 hover:border-white/10 hover:bg-white/6'
  }`;
}

function TopBar() {
  return (
    <header className="fixed inset-x-0 top-0 z-[100] border-b border-white/10 bg-black/70 backdrop-blur-md" role="banner">
      <div className="mx-auto flex h-14 w-[min(1100px,calc(100%-48px))] items-center justify-between">
        <NavLink to="/" aria-label="GCS 6th 홈" className="font-black tracking-[-0.05em]">
          GCS 6TH GROUP
        </NavLink>
        <nav aria-label="주요 메뉴" className="flex items-center gap-2">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={navClass} end={link.to === '/'}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default TopBar;
