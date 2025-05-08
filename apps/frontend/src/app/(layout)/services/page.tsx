import ServicesList from "@/app/(dashboard)/dashboard/services/_components/services-lists";

const ServicePage = () => {
  return (
    <div className="pt-10">
      <ServicesList currency="INR" />
    </div>
  );
};

export default ServicePage;
