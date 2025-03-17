import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-4xl w-full">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary-700 mb-4">4Loki Dog Grooming</h1>
          <p className="text-xl text-gray-600">Management System</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardCard 
            title="Appointments" 
            description="Manage customer appointments"
            link="/appointments"
            icon="📅"
          />
          <DashboardCard 
            title="Customers" 
            description="View and manage customer information"
            link="/customers"
            icon="👤"
          />
          <DashboardCard 
            title="Dogs" 
            description="Manage dog profiles and information"
            link="/dogs"
            icon="🐕"
          />
          <DashboardCard 
            title="Reports" 
            description="View business analytics and reports"
            link="/reports"
            icon="📊"
          />
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ title, description, link, icon }: { 
  title: string; 
  description: string; 
  link: string;
  icon: string;
}) {
  return (
    <Link href={link} className="block">
      <div className="card hover:shadow-lg transition-shadow h-full">
        <div className="text-4xl mb-4">{icon}</div>
        <h2 className="text-xl font-semibold text-primary-700 mb-2">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>
    </Link>
  );
} 