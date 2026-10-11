import ReportsTabs from './ui/ReportsTabs';

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-8">
      <div className="mb-2">
        <h1 className="text-xl font-semibold text-gray-900 print:hidden">Reportes</h1>
        <p className="text-sm text-gray-500 print:hidden">
          Consultas y análisis por dominio
        </p>
      </div>
      <ReportsTabs />
      {children}
    </div>
  );
}
