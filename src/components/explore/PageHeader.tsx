interface PageHeaderProps {
  title: string
  description: string
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-grey-900">{title}</h1>
      <p className="mt-1 text-sm text-grey-600">{description}</p>
    </div>
  )
}