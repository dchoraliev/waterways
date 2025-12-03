import svgPaths from './svg-9j8wyqtdzz';
import imgUsMap from 'figma:asset/66ffb532e20c4be5c10d2212cb43c490b92df6e7.png';

function Heading1() {
  return (
    <div className="h-[24px] relative shrink-0 w-[122.021px]" data-name="Heading 1">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[24px] relative w-[122.021px]">
        <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[24px] left-0 text-[16px] text-neutral-950 text-nowrap top-[-1.67px] whitespace-pre">
          Observation Map
        </p>
      </div>
    </div>
  );
}

function Icon() {
  return (
    <div className="absolute left-[12.67px] size-[16px] top-[10px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path
            d="M8 10V2"
            id="Vector"
            stroke="var(--stroke-0, #0A0A0A)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d={svgPaths.p23ad1400}
            id="Vector_2"
            stroke="var(--stroke-0, #0A0A0A)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d={svgPaths.p19411800}
            id="Vector_3"
            stroke="var(--stroke-0, #0A0A0A)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div
      className="basis-0 bg-white grow h-[36px] min-h-px min-w-px relative rounded-[8px] shrink-0"
      data-name="Button"
    >
      <div
        aria-hidden="true"
        className="absolute border-[0.667px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[8px]"
      />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[36px] relative w-full">
        <Icon />
        <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[20px] left-[44.67px] text-[14px] text-neutral-950 text-nowrap top-[6.67px] whitespace-pre">
          Download Data
        </p>
      </div>
    </div>
  );
}

function Icon1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path
            d={svgPaths.p399eca00}
            id="Vector"
            stroke="var(--stroke-0, #0A0A0A)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d={svgPaths.pc93b400}
            id="Vector_2"
            stroke="var(--stroke-0, #0A0A0A)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
        </g>
      </svg>
    </div>
  );
}

function Button1() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 size-[36px]" data-name="Button">
      <div
        aria-hidden="true"
        className="absolute border-[0.667px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[8px]"
      />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex items-center justify-center p-[0.667px] relative size-[36px]">
        <Icon1 />
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="h-[36px] relative shrink-0 w-[203.656px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[12px] h-[36px] items-center relative w-[203.656px]">
        <Button />
        <Button1 />
      </div>
    </div>
  );
}

function TopNavBar() {
  return (
    <div className="bg-white h-[60.667px] relative shrink-0 w-[1339.33px]" data-name="TopNavBar">
      <div
        aria-hidden="true"
        className="absolute border-[0px_0px_0.667px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none"
      />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex h-[60.667px] items-center justify-between pb-[0.667px] pt-0 px-[24px] relative w-[1339.33px]">
        <Heading1 />
        <Container />
      </div>
    </div>
  );
}

function Label() {
  return (
    <div className="h-[20px] relative shrink-0 w-[200px]" data-name="Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[20px] relative w-[200px]">
        <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[20px] left-0 text-[#717182] text-[14px] text-nowrap top-[-1.33px] whitespace-pre">
          Observation Type
        </p>
      </div>
    </div>
  );
}

function PrimitiveSpan() {
  return (
    <div className="h-[20px] relative shrink-0 w-[100.594px]" data-name="Primitive.span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[8px] h-[20px] items-center overflow-clip relative rounded-[inherit] w-[100.594px]">
        <p className="font-['Arimo:Regular',_sans-serif] font-normal leading-[20px] relative shrink-0 text-[14px] text-neutral-950 text-nowrap whitespace-pre">
          All Observations
        </p>
      </div>
    </div>
  );
}

function Icon2() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon" opacity="0.5">
          <path
            d="M4 6L8 10L12 6"
            id="Vector"
            stroke="var(--stroke-0, #717182)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
        </g>
      </svg>
    </div>
  );
}

function PrimitiveButton() {
  return (
    <div
      className="basis-0 bg-[#f3f3f5] grow min-h-px min-w-px relative rounded-[8px] shrink-0 w-[200px]"
      data-name="Primitive.button"
    >
      <div
        aria-hidden="true"
        className="absolute border-[0.667px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]"
      />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex h-full items-center justify-between px-[12.667px] py-[0.667px] relative w-[200px]">
        <PrimitiveSpan />
        <Icon2 />
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div
      className="absolute content-stretch flex flex-col gap-[6px] h-[62px] items-start left-0 top-0 w-[200px]"
      data-name="Container"
    >
      <Label />
      <PrimitiveButton />
    </div>
  );
}

function Label1() {
  return (
    <div className="h-[20px] relative shrink-0 w-[200px]" data-name="Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[20px] relative w-[200px]">
        <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[20px] left-0 text-[#717182] text-[14px] text-nowrap top-[-1.33px] whitespace-pre">
          Time Frame
        </p>
      </div>
    </div>
  );
}

function PrimitiveSpan1() {
  return (
    <div className="h-[20px] relative shrink-0 w-[49.76px]" data-name="Primitive.span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[8px] h-[20px] items-center overflow-clip relative rounded-[inherit] w-[49.76px]">
        <p className="font-['Arimo:Regular',_sans-serif] font-normal leading-[20px] relative shrink-0 text-[14px] text-neutral-950 text-nowrap whitespace-pre">
          All Time
        </p>
      </div>
    </div>
  );
}

function Icon3() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon" opacity="0.5">
          <path
            d="M4 6L8 10L12 6"
            id="Vector"
            stroke="var(--stroke-0, #717182)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
        </g>
      </svg>
    </div>
  );
}

function PrimitiveButton1() {
  return (
    <div
      className="basis-0 bg-[#f3f3f5] grow min-h-px min-w-px relative rounded-[8px] shrink-0 w-[200px]"
      data-name="Primitive.button"
    >
      <div
        aria-hidden="true"
        className="absolute border-[0.667px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]"
      />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex h-full items-center justify-between px-[12.667px] py-[0.667px] relative w-[200px]">
        <PrimitiveSpan1 />
        <Icon3 />
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div
      className="absolute content-stretch flex flex-col gap-[6px] h-[62px] items-start left-[216px] top-0 w-[200px]"
      data-name="Container"
    >
      <Label1 />
      <PrimitiveButton1 />
    </div>
  );
}

function Label2() {
  return (
    <div className="h-[20px] relative shrink-0 w-[200px]" data-name="Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[20px] relative w-[200px]">
        <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[20px] left-0 text-[#717182] text-[14px] text-nowrap top-[-1.33px] whitespace-pre">
          Filter by User
        </p>
      </div>
    </div>
  );
}

function Input() {
  return (
    <div
      className="basis-0 bg-[#f3f3f5] grow min-h-px min-w-px relative rounded-[8px] shrink-0 w-[200px]"
      data-name="Input"
    >
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex h-full items-center overflow-clip px-[12px] py-[4px] relative rounded-[inherit] w-[200px]">
        <p className="font-['Arimo:Regular',_sans-serif] font-normal leading-[normal] relative shrink-0 text-[#717182] text-[14px] text-nowrap whitespace-pre">
          Enter username
        </p>
      </div>
      <div
        aria-hidden="true"
        className="absolute border-[0.667px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]"
      />
    </div>
  );
}

function Container3() {
  return (
    <div
      className="absolute content-stretch flex flex-col gap-[6px] h-[62px] items-start left-[432px] top-0 w-[200px]"
      data-name="Container"
    >
      <Label2 />
      <Input />
    </div>
  );
}

function Label3() {
  return (
    <div className="h-[20px] opacity-0 relative shrink-0 w-[106.198px]" data-name="Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[20px] relative w-[106.198px]">
        <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[20px] left-0 text-[#717182] text-[14px] text-nowrap top-[-1.33px] whitespace-pre">
          Actions
        </p>
      </div>
    </div>
  );
}

function Button2() {
  return (
    <div
      className="basis-0 bg-[#eceef2] grow min-h-px min-w-px relative rounded-[8px] shrink-0 w-[106.198px]"
      data-name="Button"
    >
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[8px] h-full items-center justify-center px-[16px] py-[8px] relative w-[106.198px]">
        <p className="font-['Arimo:Regular',_sans-serif] font-normal leading-[20px] relative shrink-0 text-[#030213] text-[14px] text-nowrap whitespace-pre">
          Clear Filters
        </p>
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div
      className="absolute content-stretch flex flex-col gap-[6px] h-[62px] items-start left-[648px] top-0 w-[106.198px]"
      data-name="Container"
    >
      <Label3 />
      <Button2 />
    </div>
  );
}

function Container5() {
  return (
    <div className="h-[62px] relative shrink-0 w-full" data-name="Container">
      <Container1 />
      <Container2 />
      <Container3 />
      <Container4 />
    </div>
  );
}

function FilterBar() {
  return (
    <div className="bg-white h-[94.667px] relative shrink-0 w-[1339.33px]" data-name="FilterBar">
      <div
        aria-hidden="true"
        className="absolute border-[0px_0px_0.667px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none"
      />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col h-[94.667px] items-start pb-[0.667px] pt-[16px] px-[24px] relative w-[1339.33px]">
        <Container5 />
      </div>
    </div>
  );
}

function UsMap() {
  return (
    <div className="absolute h-[694px] left-0 top-0 w-[1339.33px]" data-name="USMap">
      <img
        alt=""
        className="absolute inset-0 max-w-none object-50%-50% object-contain pointer-events-none size-full"
        src={imgUsMap}
      />
    </div>
  );
}

function Container6() {
  return (
    <div
      className="absolute bg-[rgba(59,130,246,0.8)] box-border content-stretch flex items-center justify-center left-[1124.43px] p-[2.667px] rounded-[2.23696e+07px] size-[60px] top-[224.18px]"
      data-name="Container"
    >
      <div
        aria-hidden="true"
        className="absolute border-[2.667px] border-blue-500 border-solid inset-0 pointer-events-none rounded-[2.23696e+07px] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.3)]"
      />
      <p className="font-['Arimo:Regular',_sans-serif] font-normal leading-[27px] relative shrink-0 text-[18px] text-nowrap text-white whitespace-pre">
        25
      </p>
    </div>
  );
}

function Container7() {
  return (
    <div
      className="absolute bg-[rgba(59,130,246,0.8)] box-border content-stretch flex items-center justify-center left-[1141.2px] p-[2.667px] rounded-[2.23696e+07px] size-[40px] top-[207.91px]"
      data-name="Container"
    >
      <div
        aria-hidden="true"
        className="absolute border-[2.667px] border-blue-500 border-solid inset-0 pointer-events-none rounded-[2.23696e+07px] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.3)]"
      />
      <p className="font-['Arimo:Regular',_sans-serif] font-normal leading-[21px] relative shrink-0 text-[14px] text-nowrap text-white whitespace-pre">
        5
      </p>
    </div>
  );
}

function Container8() {
  return (
    <div
      className="absolute bg-[rgba(59,130,246,0.8)] box-border content-stretch flex items-center justify-center left-[126.38px] p-[2.667px] rounded-[2.23696e+07px] size-[50px] top-[391.12px]"
      data-name="Container"
    >
      <div
        aria-hidden="true"
        className="absolute border-[2.667px] border-blue-500 border-solid inset-0 pointer-events-none rounded-[2.23696e+07px] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.3)]"
      />
      <p className="font-['Arimo:Regular',_sans-serif] font-normal leading-[24px] relative shrink-0 text-[16px] text-nowrap text-white whitespace-pre">
        15
      </p>
    </div>
  );
}

function Container9() {
  return (
    <div
      className="absolute bg-[rgba(59,130,246,0.8)] box-border content-stretch flex items-center justify-center left-[134.29px] p-[2.667px] rounded-[2.23696e+07px] size-[40px] top-[429.07px]"
      data-name="Container"
    >
      <div
        aria-hidden="true"
        className="absolute border-[2.667px] border-blue-500 border-solid inset-0 pointer-events-none rounded-[2.23696e+07px] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.3)]"
      />
      <p className="font-['Arimo:Regular',_sans-serif] font-normal leading-[21px] relative shrink-0 text-[14px] text-nowrap text-white whitespace-pre">
        10
      </p>
    </div>
  );
}

function Container10() {
  return (
    <div
      className="absolute bg-[rgba(59,130,246,0.8)] box-border content-stretch flex items-center justify-center left-[823.95px] p-[2.667px] rounded-[2.23696e+07px] size-[50px] top-[178.44px]"
      data-name="Container"
    >
      <div
        aria-hidden="true"
        className="absolute border-[2.667px] border-blue-500 border-solid inset-0 pointer-events-none rounded-[2.23696e+07px] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.3)]"
      />
      <p className="font-['Arimo:Regular',_sans-serif] font-normal leading-[24px] relative shrink-0 text-[16px] text-nowrap text-white whitespace-pre">
        11
      </p>
    </div>
  );
}

function Container11() {
  return (
    <div
      className="absolute bg-[rgba(59,130,246,0.8)] box-border content-stretch flex items-center justify-center left-[833.15px] p-[2.667px] rounded-[2.23696e+07px] size-[40px] top-[204.37px]"
      data-name="Container"
    >
      <div
        aria-hidden="true"
        className="absolute border-[2.667px] border-blue-500 border-solid inset-0 pointer-events-none rounded-[2.23696e+07px] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.3)]"
      />
      <p className="font-['Arimo:Regular',_sans-serif] font-normal leading-[21px] relative shrink-0 text-[14px] text-nowrap text-white whitespace-pre">
        8
      </p>
    </div>
  );
}

function Icon4() {
  return (
    <div
      className="h-[32px] overflow-clip relative shadow-[0px_2px_8px_0px_rgba(0,0,0,0.3)] shrink-0 w-full"
      data-name="Icon"
    >
      <div className="absolute inset-[8.33%_16.67%]" data-name="Vector">
        <div className="absolute inset-[-5%_-6.25%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 25 30"
          >
            <path
              d={svgPaths.p3f4eea00}
              fill="var(--fill-0, #E7000B)"
              id="Vector"
              stroke="var(--stroke-0, #E7000B)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.66667"
            />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[29.17%_37.5%_45.83%_37.5%]" data-name="Vector">
        <div className="absolute inset-[-16.667%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 12 12"
          >
            <path
              d={svgPaths.p335f3460}
              fill="var(--fill-0, #E7000B)"
              id="Vector"
              stroke="var(--stroke-0, #E7000B)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.66667"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container12() {
  return (
    <div
      className="absolute content-stretch flex flex-col items-start left-[819.03px] size-[32px] top-[221.68px]"
      data-name="Container"
    >
      <Icon4 />
    </div>
  );
}

function Container13() {
  return (
    <div
      className="absolute bg-[rgba(59,130,246,0.8)] box-border content-stretch flex items-center justify-center left-[646.84px] p-[2.667px] rounded-[2.23696e+07px] size-[50px] top-[512.47px]"
      data-name="Container"
    >
      <div
        aria-hidden="true"
        className="absolute border-[2.667px] border-blue-500 border-solid inset-0 pointer-events-none rounded-[2.23696e+07px] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.3)]"
      />
      <p className="font-['Arimo:Regular',_sans-serif] font-normal leading-[24px] relative shrink-0 text-[16px] text-nowrap text-white whitespace-pre">
        11
      </p>
    </div>
  );
}

function Container14() {
  return (
    <div
      className="absolute bg-[rgba(59,130,246,0.8)] box-border content-stretch flex items-center justify-center left-[650.22px] p-[2.667px] rounded-[2.23696e+07px] size-[40px] top-[546.1px]"
      data-name="Container"
    >
      <div
        aria-hidden="true"
        className="absolute border-[2.667px] border-blue-500 border-solid inset-0 pointer-events-none rounded-[2.23696e+07px] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.3)]"
      />
      <p className="font-['Arimo:Regular',_sans-serif] font-normal leading-[21px] relative shrink-0 text-[14px] text-nowrap text-white whitespace-pre">
        3
      </p>
    </div>
  );
}

function Icon5() {
  return (
    <div
      className="h-[32px] overflow-clip relative shadow-[0px_2px_8px_0px_rgba(0,0,0,0.3)] shrink-0 w-full"
      data-name="Icon"
    >
      <div className="absolute inset-[8.33%_16.67%]" data-name="Vector">
        <div className="absolute inset-[-5%_-6.25%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 25 30"
          >
            <path
              d={svgPaths.p3f4eea00}
              fill="var(--fill-0, #E7000B)"
              id="Vector"
              stroke="var(--stroke-0, #E7000B)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.66667"
            />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[29.17%_37.5%_45.83%_37.5%]" data-name="Vector">
        <div className="absolute inset-[-16.667%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 12 12"
          >
            <path
              d={svgPaths.p335f3460}
              fill="var(--fill-0, #E7000B)"
              id="Vector"
              stroke="var(--stroke-0, #E7000B)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.66667"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div
      className="absolute content-stretch flex flex-col items-start left-[678.74px] size-[32px] top-[527.32px]"
      data-name="Container"
    >
      <Icon5 />
    </div>
  );
}

function Container16() {
  return (
    <div
      className="absolute bg-[rgba(59,130,246,0.8)] box-border content-stretch flex items-center justify-center left-[272.3px] p-[2.667px] rounded-[2.23696e+07px] size-[40px] top-[442.2px]"
      data-name="Container"
    >
      <div
        aria-hidden="true"
        className="absolute border-[2.667px] border-blue-500 border-solid inset-0 pointer-events-none rounded-[2.23696e+07px] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.3)]"
      />
      <p className="font-['Arimo:Regular',_sans-serif] font-normal leading-[21px] relative shrink-0 text-[14px] text-nowrap text-white whitespace-pre">
        7
      </p>
    </div>
  );
}

function Container17() {
  return (
    <div
      className="absolute bg-[rgba(59,130,246,0.8)] box-border content-stretch flex items-center justify-center left-[258.01px] p-[2.667px] rounded-[2.23696e+07px] size-[40px] top-[412.95px]"
      data-name="Container"
    >
      <div
        aria-hidden="true"
        className="absolute border-[2.667px] border-blue-500 border-solid inset-0 pointer-events-none rounded-[2.23696e+07px] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.3)]"
      />
      <p className="font-['Arimo:Regular',_sans-serif] font-normal leading-[21px] relative shrink-0 text-[14px] text-nowrap text-white whitespace-pre">
        5
      </p>
    </div>
  );
}

function Container18() {
  return (
    <div className="absolute h-[694px] left-0 top-0 w-[1339.33px]" data-name="Container">
      <Container6 />
      <Container7 />
      <Container8 />
      <Container9 />
      <Container10 />
      <Container11 />
      <Container12 />
      <Container13 />
      <Container14 />
      <Container15 />
      <Container16 />
      <Container17 />
    </div>
  );
}

function Container19() {
  return (
    <div className="absolute h-[694px] left-0 top-0 w-[1339.33px]" data-name="Container">
      <UsMap />
      <Container18 />
    </div>
  );
}

function Icon6() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path
            d={svgPaths.p107a080}
            id="Vector"
            stroke="var(--stroke-0, #030213)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M14 14L11.1 11.1"
            id="Vector_2"
            stroke="var(--stroke-0, #030213)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M7.33333 5.33333V9.33333"
            id="Vector_3"
            stroke="var(--stroke-0, #030213)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M5.33333 7.33333H9.33333"
            id="Vector_4"
            stroke="var(--stroke-0, #030213)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
        </g>
      </svg>
    </div>
  );
}

function Button3() {
  return (
    <div className="bg-[#eceef2] relative rounded-[8px] shrink-0 size-[36px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex items-center justify-center relative size-[36px]">
        <Icon6 />
      </div>
    </div>
  );
}

function Icon7() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path
            d={svgPaths.p107a080}
            id="Vector"
            stroke="var(--stroke-0, #030213)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M14 14L11.1 11.1"
            id="Vector_2"
            stroke="var(--stroke-0, #030213)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M5.33333 7.33333H9.33333"
            id="Vector_3"
            stroke="var(--stroke-0, #030213)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
        </g>
      </svg>
    </div>
  );
}

function Button4() {
  return (
    <div
      className="bg-[#eceef2] opacity-50 relative rounded-[8px] shrink-0 size-[36px]"
      data-name="Button"
    >
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex items-center justify-center relative size-[36px]">
        <Icon7 />
      </div>
    </div>
  );
}

function Container20() {
  return (
    <div
      className="bg-white h-[25.333px] relative rounded-[4px] shrink-0 w-[38.385px]"
      data-name="Container"
    >
      <div
        aria-hidden="true"
        className="absolute border-[0.667px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[4px]"
      />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[25.333px] relative w-[38.385px]">
        <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[16px] left-[19.67px] text-[12px] text-center text-neutral-950 top-[3.67px] translate-x-[-50%] w-[22px]">
          1.0x
        </p>
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div
      className="absolute content-stretch flex flex-col gap-[8px] h-[113.333px] items-start left-[1284.95px] top-[16px] w-[38.385px]"
      data-name="Container"
    >
      <Button3 />
      <Button4 />
      <Container20 />
    </div>
  );
}

function Text() {
  return (
    <div
      className="absolute content-stretch flex h-[18.667px] items-start left-[57.08px] top-[0.67px] w-[22.646px]"
      data-name="Text"
    >
      <p className="font-['Arimo:Regular',_sans-serif] font-normal leading-[20px] relative shrink-0 text-[14px] text-neutral-950 text-nowrap whitespace-pre">
        102
      </p>
    </div>
  );
}

function Text1() {
  return (
    <div
      className="absolute content-stretch flex h-[18.667px] items-start left-[100px] top-[0.67px] w-[22.646px]"
      data-name="Text"
    >
      <p className="font-['Arimo:Regular',_sans-serif] font-normal leading-[20px] relative shrink-0 text-[14px] text-neutral-950 text-nowrap whitespace-pre">
        102
      </p>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[20px] left-0 text-[14px] text-neutral-950 text-nowrap top-[-1.33px] whitespace-pre">
        Showing
      </p>
      <Text />
      <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[20px] left-[79.73px] text-[14px] text-neutral-950 top-[-1.33px] w-[21px]">
        of
      </p>
      <Text1 />
      <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[20px] left-[122.65px] text-[14px] text-neutral-950 text-nowrap top-[-1.33px] whitespace-pre">
        observations
      </p>
    </div>
  );
}

function Container22() {
  return (
    <div
      className="absolute bg-white box-border content-stretch flex flex-col h-[45.333px] items-start left-[16px] pb-[0.667px] pt-[12.667px] px-[12.667px] rounded-[10px] top-[632.67px] w-[230.417px]"
      data-name="Container"
    >
      <div
        aria-hidden="true"
        className="absolute border-[0.667px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[10px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]"
      />
      <Paragraph />
    </div>
  );
}

function Heading3() {
  return (
    <div className="h-[24px] relative shrink-0 w-[137.792px]" data-name="Heading 3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[24px] relative w-[137.792px]">
        <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[24px] left-0 text-[16px] text-neutral-950 text-nowrap top-[-1.67px] whitespace-pre">
          Observation Details
        </p>
      </div>
    </div>
  );
}

function Icon8() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path
            d="M12 4L4 12"
            id="Vector"
            stroke="var(--stroke-0, #0A0A0A)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M4 4L12 12"
            id="Vector_2"
            stroke="var(--stroke-0, #0A0A0A)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
        </g>
      </svg>
    </div>
  );
}

function Button5() {
  return (
    <div className="relative rounded-[8px] shrink-0 size-[36px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex items-center justify-center relative size-[36px]">
        <Icon8 />
      </div>
    </div>
  );
}

function Container23() {
  return (
    <div className="h-[36px] relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex h-[36px] items-center justify-between relative w-full">
          <Heading3 />
          <Button5 />
        </div>
      </div>
    </div>
  );
}

function Heading4() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Heading 4">
      <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[24px] left-0 text-[16px] text-neutral-950 text-nowrap top-[-1.67px] whitespace-pre">
        Observation #63
      </p>
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[20px] left-0 text-[14px] text-neutral-950 text-nowrap top-[-1.33px] whitespace-pre">
        Sample observation data collected in the field.
      </p>
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[20px] left-0 text-[#717182] text-[14px] top-[-1.33px] w-[71px]">
        Type: type2
      </p>
    </div>
  );
}

function Paragraph3() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[20px] left-0 text-[#717182] text-[14px] top-[-1.33px] w-[71px]">
        User: Diana
      </p>
    </div>
  );
}

function Paragraph4() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[20px] left-0 text-[#717182] text-[14px] top-[-1.33px] w-[100px]">
        Date: 1/21/2025
      </p>
    </div>
  );
}

function Container24() {
  return (
    <div
      className="content-stretch flex flex-col gap-[4px] h-[68px] items-start relative shrink-0 w-full"
      data-name="Container"
    >
      <Paragraph2 />
      <Paragraph3 />
      <Paragraph4 />
    </div>
  );
}

function Container25() {
  return (
    <div
      className="content-stretch flex flex-col gap-[4px] h-[136px] items-start relative shrink-0 w-full"
      data-name="Container"
    >
      <Heading4 />
      <Paragraph1 />
      <Container24 />
    </div>
  );
}

function Container26() {
  return (
    <div
      className="absolute bg-white h-[217.333px] left-[16px] rounded-[10px] top-[16px] w-[318.406px]"
      data-name="Container"
    >
      <div className="box-border content-stretch flex flex-col gap-[12px] h-[217.333px] items-start overflow-clip pb-[0.667px] pt-[16.667px] px-[16.667px] relative rounded-[inherit] w-[318.406px]">
        <Container23 />
        <Container25 />
      </div>
      <div
        aria-hidden="true"
        className="absolute border-[0.667px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[10px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]"
      />
    </div>
  );
}

function MapView() {
  return (
    <div
      className="bg-gray-100 h-[694px] overflow-clip relative shrink-0 w-full"
      data-name="MapView"
    >
      <Container19 />
      <Container21 />
      <Container22 />
      <Container26 />
    </div>
  );
}

function Container27() {
  return (
    <div
      className="basis-0 grow min-h-px min-w-px relative shrink-0 w-[1339.33px]"
      data-name="Container"
    >
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col h-full items-start overflow-clip relative rounded-[inherit] w-[1339.33px]">
        <MapView />
      </div>
    </div>
  );
}

export default function MapPageWithFilters() {
  return (
    <div
      className="bg-white content-stretch flex flex-col items-start relative size-full"
      data-name="Map Page with Filters"
    >
      <TopNavBar />
      <FilterBar />
      <Container27 />
    </div>
  );
}
