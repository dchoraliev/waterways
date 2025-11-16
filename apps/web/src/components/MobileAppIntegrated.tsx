import svgPaths from './svg-8yiw8arkc7';

function Icon() {
  return (
    <div className="relative shrink-0 size-[40px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 40 40">
        <g id="Icon">
          <path
            d={svgPaths.p16553880}
            id="Vector"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3.33333"
          />
          <path
            d={svgPaths.p207ccec0}
            id="Vector_2"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3.33333"
          />
          <path
            d={svgPaths.pc083940}
            id="Vector_3"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3.33333"
          />
        </g>
      </svg>
    </div>
  );
}

function Container() {
  return (
    <div
      className="absolute bg-blue-500 box-border content-stretch flex items-center justify-center left-[192px] rounded-[16px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] size-[64px] top-0"
      data-name="Container"
    >
      <Icon />
    </div>
  );
}

function Heading1() {
  return (
    <div className="h-[36px] relative shrink-0 w-full" data-name="Heading 1">
      <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[36px] left-[224.14px] text-[#1e3a5f] text-[24px] text-center text-nowrap top-[-2px] translate-x-[-50%] whitespace-pre">
        Welcome to WaDE
      </p>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[24px] left-[224.17px] text-[16px] text-center text-nowrap text-slate-500 top-[-2px] translate-x-[-50%] whitespace-pre">
        Waterway Delta Explorer
      </p>
    </div>
  );
}

function Container1() {
  return (
    <div
      className="absolute content-stretch flex flex-col h-[60px] items-start left-0 top-[76px] w-[448px]"
      data-name="Container"
    >
      <Heading1 />
      <Paragraph />
    </div>
  );
}

function Container2() {
  return (
    <div className="h-[136px] relative shrink-0 w-full" data-name="Container">
      <Container />
      <Container1 />
    </div>
  );
}

function CardTitle() {
  return (
    <div className="[grid-area:1_/_1] relative shrink-0" data-name="CardTitle">
      <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[16px] left-0 text-[#1e3a5f] text-[16px] text-nowrap top-[-2px] whitespace-pre">
        Sign In
      </p>
    </div>
  );
}

function CardDescription() {
  return (
    <div className="[grid-area:2_/_1] relative shrink-0" data-name="CardDescription">
      <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[24px] left-0 text-[16px] text-nowrap text-slate-500 top-[-2px] whitespace-pre">
        Enter your credentials to access your account
      </p>
    </div>
  );
}

function CardHeader() {
  return (
    <div className="h-[70px] relative shrink-0 w-[446px]" data-name="CardHeader">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border gap-[6px] grid grid-cols-[repeat(1,_minmax(0px,_1fr))] grid-rows-[16px_minmax(0px,_1fr)] h-[70px] pb-0 pt-[24px] px-[24px] relative w-[446px]">
        <CardTitle />
        <CardDescription />
      </div>
    </div>
  );
}

function PrimitiveLabel() {
  return (
    <div
      className="content-stretch flex gap-[8px] h-[14px] items-center relative shrink-0 w-full"
      data-name="Primitive.label"
    >
      <p className="font-['Arimo:Regular',_sans-serif] font-normal leading-[14px] relative shrink-0 text-[#1e3a5f] text-[14px] text-nowrap whitespace-pre">
        Email
      </p>
    </div>
  );
}

function Input() {
  return (
    <div className="bg-sky-50 h-[36px] relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex h-[36px] items-center px-[12px] py-[4px] relative w-full">
          <p className="font-['Arimo:Regular',_sans-serif] font-normal leading-[normal] relative shrink-0 text-[14px] text-nowrap text-slate-500 whitespace-pre">
            your.email@example.com
          </p>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="absolute border border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]"
      />
    </div>
  );
}

function Container3() {
  return (
    <div
      className="content-stretch flex flex-col gap-[8px] h-[58px] items-start relative shrink-0 w-full"
      data-name="Container"
    >
      <PrimitiveLabel />
      <Input />
    </div>
  );
}

function PrimitiveLabel1() {
  return (
    <div className="h-[14px] relative shrink-0 w-[59.563px]" data-name="Primitive.label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[8px] h-[14px] items-center relative w-[59.563px]">
        <p className="font-['Arimo:Regular',_sans-serif] font-normal leading-[14px] relative shrink-0 text-[#1e3a5f] text-[14px] text-nowrap whitespace-pre">
          Password
        </p>
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="h-[20px] relative shrink-0 w-[47.375px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex h-[20px] items-start relative w-[47.375px]">
        <p className="font-['Arimo:Regular',_sans-serif] font-normal leading-[20px] relative shrink-0 text-[14px] text-blue-500 text-nowrap whitespace-pre">
          Forgot?
        </p>
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div
      className="content-stretch flex h-[20px] items-center justify-between relative shrink-0 w-full"
      data-name="Container"
    >
      <PrimitiveLabel1 />
      <Button />
    </div>
  );
}

function Input1() {
  return (
    <div className="bg-sky-50 h-[36px] relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex h-[36px] items-center px-[12px] py-[4px] relative w-full">
          <p className="font-['Arimo:Regular',_sans-serif] font-normal leading-[normal] relative shrink-0 text-[14px] text-nowrap text-slate-500 whitespace-pre">
            Enter your password
          </p>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="absolute border border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]"
      />
    </div>
  );
}

function Container5() {
  return (
    <div
      className="content-stretch flex flex-col gap-[8px] h-[64px] items-start relative shrink-0 w-full"
      data-name="Container"
    >
      <Container4 />
      <Input1 />
    </div>
  );
}

function Button1() {
  return (
    <div className="bg-blue-500 h-[36px] relative rounded-[8px] shrink-0 w-full" data-name="Button">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[8px] h-[36px] items-center justify-center px-[16px] py-[8px] relative w-full">
          <p className="basis-0 font-['Arimo:Regular',_sans-serif] font-normal grow leading-[20px] min-h-px min-w-px relative shrink-0 text-[14px] text-white">
            Sign In
          </p>
        </div>
      </div>
    </div>
  );
}

function SignInPage() {
  return (
    <div
      className="content-stretch flex flex-col gap-[16px] h-[190px] items-start relative shrink-0 w-full"
      data-name="SignInPage"
    >
      <Container3 />
      <Container5 />
      <Button1 />
    </div>
  );
}

function Button2() {
  return (
    <div className="absolute h-[24px] left-[244.67px] top-0 w-[57.156px]" data-name="Button">
      <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[24px] left-0 text-[16px] text-blue-500 text-nowrap top-[-2px] whitespace-pre">
        Sign Up
      </p>
    </div>
  );
}

function SignInPage1() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="SignInPage">
      <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[20px] left-[170.67px] text-[14px] text-center text-slate-500 top-px translate-x-[-50%] w-[149px]">{`Don't have an account?`}</p>
      <Button2 />
    </div>
  );
}

function CardContent() {
  return (
    <div
      className="basis-0 grow min-h-px min-w-px relative shrink-0 w-[446px]"
      data-name="CardContent"
    >
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[16px] h-full items-start px-[24px] py-0 relative w-[446px]">
        <SignInPage />
        <SignInPage1 />
      </div>
    </div>
  );
}

function Card() {
  return (
    <div
      className="bg-white box-border content-stretch flex flex-col gap-[24px] h-[350px] items-start p-px relative rounded-[14px] shrink-0 w-full"
      data-name="Card"
    >
      <div
        aria-hidden="true"
        className="absolute border border-sky-100 border-solid inset-0 pointer-events-none rounded-[14px]"
      />
      <CardHeader />
      <CardContent />
    </div>
  );
}

function SignInPage2() {
  return (
    <div
      className="bg-[rgba(240,249,255,0.3)] content-stretch flex flex-col gap-[24px] h-[510px] items-start relative shrink-0 w-full"
      data-name="SignInPage"
    >
      <Container2 />
      <Card />
    </div>
  );
}

export default function MobileAppIntegrated() {
  return (
    <div className="bg-white relative size-full" data-name="Mobile App Integrated">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col items-start pb-0 pt-[242px] px-[547px] relative size-full">
          <SignInPage2 />
        </div>
      </div>
    </div>
  );
}
