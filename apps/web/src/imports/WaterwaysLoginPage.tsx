import imgImageWithFallback from '../../assets/images/background.png';

function ImageWithFallback() {
  return (
    <div className="absolute h-[786.4px] left-0 top-0 w-[1159.2px]" data-name="ImageWithFallback">
      <img
        alt=""
        className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full"
        src={imgImageWithFallback}
      />
    </div>
  );
}

function Container() {
  return <div className="absolute h-[786.4px] left-0 top-0 w-[1159.2px]" data-name="Container" />;
}

function Container1() {
  return (
    <div className="absolute h-[786.4px] left-0 top-0 w-[1159.2px]" data-name="Container">
      <ImageWithFallback />
      <Container />
    </div>
  );
}

function Heading1() {
  return (
    <div
      className="h-[48px] relative shadow-[0px_4px_8px_0px_rgba(0,0,0,0.15)] shrink-0 w-full"
      data-name="Heading 1"
    >
      <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[48px] left-[199.93px] text-[48px] text-center text-nowrap text-white top-[-5px] translate-x-[-50%] whitespace-pre">
        Waterways
      </p>
    </div>
  );
}

function Paragraph() {
  return (
    <div
      className="h-[28px] opacity-90 relative shadow-[0px_3px_6px_0px_rgba(0,0,0,0.12)] shrink-0 w-full"
      data-name="Paragraph"
    >
      <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[28px] left-[200.01px] text-[20px] text-center text-nowrap text-white top-[-2.2px] translate-x-[-50%] whitespace-pre">
        Navigate your water journey
      </p>
    </div>
  );
}

function Container2() {
  return (
    <div
      className="content-stretch flex flex-col gap-[8px] h-[84px] items-start relative shrink-0 w-full"
      data-name="Container"
    >
      <Heading1 />
      <Paragraph />
    </div>
  );
}

function CardTitle() {
  return (
    <div className="h-[36px] relative shrink-0 w-full" data-name="CardTitle">
      <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[36px] left-[175px] text-[30px] text-center text-neutral-950 text-nowrap top-[-2.6px] translate-x-[-50%] whitespace-pre">
        Welcome Back
      </p>
    </div>
  );
}

function CardDescription() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="CardDescription">
      <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[24px] left-[176.06px] text-[#717182] text-[16px] text-center text-nowrap top-[-2.2px] translate-x-[-50%] whitespace-pre">
        Sign in to your Waterways account to continue
      </p>
    </div>
  );
}

function LoginForm() {
  return (
    <div
      className="absolute content-stretch flex flex-col gap-[8px] h-[68px] items-start left-[24.8px] top-[24.8px] w-[350.4px]"
      data-name="LoginForm"
    >
      <CardTitle />
      <CardDescription />
    </div>
  );
}

function PrimitiveLabel() {
  return (
    <div
      className="content-stretch flex gap-[8px] h-[14px] items-center relative shrink-0 w-full"
      data-name="Primitive.label"
    >
      <p className="font-['Arimo:Regular',_sans-serif] font-normal leading-[14px] relative shrink-0 text-[14px] text-neutral-950 text-nowrap whitespace-pre">
        Email
      </p>
    </div>
  );
}

function Input() {
  return (
    <div className="bg-[#f3f3f5] h-[36px] relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex h-[36px] items-center px-[12px] py-[4px] relative w-full">
          <p className="font-['Arimo:Regular',_sans-serif] font-normal leading-[normal] relative shrink-0 text-[#717182] text-[14px] text-nowrap whitespace-pre">
            Enter your email
          </p>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="absolute border-[0.8px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]"
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
    <div
      className="content-stretch flex gap-[8px] h-[14px] items-center relative shrink-0 w-full"
      data-name="Primitive.label"
    >
      <p className="font-['Arimo:Regular',_sans-serif] font-normal leading-[14px] relative shrink-0 text-[14px] text-neutral-950 text-nowrap whitespace-pre">
        Password
      </p>
    </div>
  );
}

function Input1() {
  return (
    <div className="bg-[#f3f3f5] h-[36px] relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex h-[36px] items-center px-[12px] py-[4px] relative w-full">
          <p className="font-['Arimo:Regular',_sans-serif] font-normal leading-[normal] relative shrink-0 text-[#717182] text-[14px] text-nowrap whitespace-pre">
            Enter your password
          </p>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="absolute border-[0.8px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]"
      />
    </div>
  );
}

function Container4() {
  return (
    <div
      className="content-stretch flex flex-col gap-[8px] h-[58px] items-start relative shrink-0 w-full"
      data-name="Container"
    >
      <PrimitiveLabel1 />
      <Input1 />
    </div>
  );
}

function Button() {
  return (
    <div
      className="bg-[#030213] h-[36px] relative rounded-[8px] shrink-0 w-full"
      data-name="Button"
    >
      <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[20px] left-[153.2px] text-[14px] text-nowrap text-white top-[6.8px] whitespace-pre">
        Sign In
      </p>
    </div>
  );
}

function LoginForm1() {
  return (
    <div
      className="absolute content-stretch flex flex-col gap-[16px] h-[184px] items-start left-[24px] top-0 w-[350.4px]"
      data-name="LoginForm"
    >
      <Container3 />
      <Container4 />
      <Button />
    </div>
  );
}

function Button1() {
  return (
    <div
      className="absolute h-[20px] left-[126.7px] rounded-[8px] top-[210.4px] w-[144.988px]"
      data-name="Button"
    >
      <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[20px] left-0 text-[#030213] text-[14px] text-nowrap top-[-1.2px] whitespace-pre">
        Forgot your password?
      </p>
    </div>
  );
}

function PrimitiveDiv() {
  return (
    <div
      className="absolute bg-[rgba(0,0,0,0.1)] h-px left-[24px] top-[256px] w-[350.4px]"
      data-name="Primitive.div"
    />
  );
}

function Paragraph1() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[24px] left-[175.54px] text-[#717182] text-[16px] text-center text-nowrap top-[-2.2px] translate-x-[-50%] whitespace-pre">{`Don't have an account?`}</p>
    </div>
  );
}

function Button2() {
  return (
    <div className="bg-white h-[36px] relative rounded-[8px] shrink-0 w-full" data-name="Button">
      <div
        aria-hidden="true"
        className="absolute border-[0.8px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[8px]"
      />
      <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[20px] left-[126.65px] text-[14px] text-neutral-950 text-nowrap top-[6.8px] whitespace-pre">
        Create Account
      </p>
    </div>
  );
}

function LoginForm2() {
  return (
    <div
      className="absolute content-stretch flex flex-col gap-[8px] h-[68px] items-start left-[24px] top-[281px] w-[350.4px]"
      data-name="LoginForm"
    >
      <Paragraph1 />
      <Button2 />
    </div>
  );
}

function CardContent() {
  return (
    <div
      className="absolute h-[373px] left-[0.8px] top-[122.8px] w-[398.4px]"
      data-name="CardContent"
    >
      <LoginForm1 />
      <Button1 />
      <PrimitiveDiv />
      <LoginForm2 />
    </div>
  );
}

function Card() {
  return (
    <div
      className="bg-[rgba(255,255,255,0.95)] h-[496.6px] relative rounded-[14px] shrink-0 w-full"
      data-name="Card"
    >
      <div
        aria-hidden="true"
        className="absolute border-[0.8px] border-[rgba(255,255,255,0.2)] border-solid inset-0 pointer-events-none rounded-[14px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]"
      />
      <LoginForm />
      <CardContent />
    </div>
  );
}

function Paragraph2() {
  return (
    <div
      className="h-[24px] relative shadow-[0px_3px_6px_0px_rgba(0,0,0,0.12)] shrink-0 w-full"
      data-name="Paragraph"
    >
      <p className="absolute font-['Arimo:Regular',_sans-serif] font-normal leading-[24px] left-[200.03px] text-[16px] text-[rgba(255,255,255,0.8)] text-center text-nowrap top-[-2.2px] translate-x-[-50%] whitespace-pre">
        © 2024 Waterways. All rights reserved.
      </p>
    </div>
  );
}

function Container5() {
  return (
    <div
      className="absolute box-border content-stretch flex flex-col gap-[32px] h-[716.6px] items-start left-[355.6px] pb-0 pt-[24px] px-[24px] top-[34.9px] w-[448px]"
      data-name="Container"
    >
      <Container2 />
      <Card />
      <Paragraph2 />
    </div>
  );
}

export default function WaterwaysLoginPage() {
  return (
    <div className="bg-white relative size-full" data-name="Waterways Login Page">
      <Container1 />
      <Container5 />
    </div>
  );
}
