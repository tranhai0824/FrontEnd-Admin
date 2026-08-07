import { ArrowRight } from 'lucide-react';
import masterProgramIcon from '../assets/images/master-program-icon.png';
import minhAnhImage from '../assets/images/story-minh-anh.png';
import tuanImage from '../assets/images/story-tuan.png';
import linhDanImage from '../assets/images/story-linh-dan.png';

interface SuccessStoriesProps {
  onExplore: () => void;
}

const stories = [
  {
    image: minhAnhImage,
    quote: 'Một cơ hội đúng lúc đã thay đổi cả hành trình của mình…',
    author: 'Minh Anh',
  },
  {
    image: tuanImage,
    quote: 'Mình tìm thấy niềm hạnh phúc và một suất học bổng…',
    author: 'Tuấn',
  },
  {
    image: linhDanImage,
    quote: 'Có người đồng hành, mọi thử thách đều dễ dàng hơn…',
    author: 'Linh Đan',
  },
];

export default function SuccessStories({ onExplore }: SuccessStoriesProps) {
  return (
    <>
      <section className="bg-[#F5F9FE] py-12 sm:py-16" aria-labelledby="success-stories-title">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.7fr] lg:items-end lg:px-8">
        <div className="pb-1">
          <h2 id="success-stories-title" className="max-w-[320px] text-3xl font-extrabold leading-tight tracking-tight text-[#43220F] sm:text-4xl">
            Kết nối với những hành trình đi đến <span className="text-[#2D80C2]">Thành Công</span>
          </h2>
          <p className="mt-4 max-w-[310px] text-sm leading-6 text-[#3B2E25]">
            Mỗi câu chuyện là minh chứng cho sự nỗ lực và một lựa chọn đúng đăn, một cơ hội đến đúng thời điểm
          </p>
          <button
            type="button"
            onClick={onExplore}
            className="mt-8 inline-flex min-w-48 items-center justify-center gap-2 rounded-xl bg-[#42A7F4] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#258FE2]"
          >
            Kết nối ngay <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stories.map((story) => (
            <article key={story.author} className="group relative h-[300px] overflow-hidden rounded-xl bg-slate-200 shadow-sm">
              <img src={story.image} alt={`Câu chuyện của ${story.author}`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#168FDC]/95 via-[#168FDC]/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-right text-xs leading-5 text-white">
                <p className="text-left">“{story.quote}”</p>
                <p className="mt-1 text-[11px] italic">{story.author}</p>
              </div>
            </article>
          ))}
        </div>
        </div>
      </section>

      <section className="bg-[#F5F9FE] pb-10" aria-label="Bài kiểm tra định hướng">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 rounded-xl bg-[#2B82A5] px-6 py-5 text-white sm:flex-row sm:px-7">
          <img src={masterProgramIcon} alt="" className="h-16 w-16 shrink-0 object-contain brightness-0 invert" />
          <p className="flex-1 text-center text-base font-medium sm:text-left sm:text-lg">
            Đánh giá năng lực! Khám phá, tìm kiếm chương trình và học bổng phù hợp với bạn
          </p>
          <button
            type="button"
            onClick={onExplore}
            className="min-h-12 shrink-0 rounded-sm border-2 border-[#123A4B] bg-white px-7 py-2.5 text-sm font-bold text-[#182B34] transition-colors hover:bg-[#EAF7FC] sm:text-base"
          >
            Làm bài kiểm tra miễn phí!
          </button>
        </div>
      </section>
    </>
  );
}
