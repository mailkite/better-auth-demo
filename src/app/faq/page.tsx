import React from "react";

import { Background } from "@/components/background";
import { FAQ } from "@/components/blocks/faq";

const Page = () => {
  return (
    <Background>
      <FAQ
        className="py-28 text-center lg:pt-44 lg:pb-32"
        className2="mx-auto max-w-2xl"
        headerTag="h1"
      />
    </Background>
  );
};

export default Page;
