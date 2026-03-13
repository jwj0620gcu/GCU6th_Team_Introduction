function YujeongPage() {
  return (
    <section className="h-[calc(100vh-56px)] w-full overflow-hidden bg-black">
      <iframe
        src="/yujeong/index.html"
        title="전유정 개인 페이지"
        className="h-full w-full border-0"
        loading="eager"
      />
    </section>
  );
}

export default YujeongPage;
