import Header from "./components/header"


const StudentDashboard = () => {
  return (
    <>
      <main className="max-w-[570px] mx-auto md:max-w-full xl:max-w-[1440px] space-y-10">
        <Header />

        <section className="px-24">
          <h1 className="">Student Maintenance Requests</h1>
        </section>
      </main>
    </>

  )
}

export default StudentDashboard