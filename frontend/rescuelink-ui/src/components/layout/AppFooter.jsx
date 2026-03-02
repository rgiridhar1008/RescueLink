function AppFooter() {
  return (
    <footer className='app-footer mt-4'>
      <div className='container py-4'>
        <div className='text-center d-flex flex-column gap-2'>
          <p className='mb-0'>&copy; 2026 RescueLink. All rights reserved.</p>
          <p className='mb-0'><strong>Developed by</strong></p>
          <p className='mb-0'>
            <a href='https://www.linkedin.com/in/giridhar-rls/' target='_blank' rel='noreferrer'>
              Rachakonda Lakshmi Sai Giridhar
            </a>
            {' | '}Bandi Srihitha | Pranathi Prathipati | DonthiReddy Krishna Chaitanya
          </p>
        </div>
      </div>
    </footer>
  );
}

export default AppFooter;
