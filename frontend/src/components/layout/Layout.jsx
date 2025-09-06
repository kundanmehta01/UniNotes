import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { cn } from '../../lib/utils';

const Layout = ({ children, className, showFooter = true }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className={cn('flex-1', className)}>
        {children || <Outlet />}
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;
