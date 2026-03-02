function SkeletonCard() {
  return (
    <div className='card card-soft p-3 h-100'>
      <div className='placeholder-glow'>
        <span className='placeholder col-8 mb-3' />
        <span className='placeholder col-6 mb-2' />
        <span className='placeholder col-7 mb-2' />
        <span className='placeholder col-4' />
      </div>
    </div>
  );
}

export default SkeletonCard;
