"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { getProject } from "@/content/projects";
import { services } from "@/content/services";

/** The four services as rows. Pointing at one shows its strongest proof beside the list. */
export function ServiceRows() {
  const [current, setCurrent] = useState(services[2].slug);
  const active = services.find((service) => service.slug === current) ?? services[0];
  const proof = getProject(active.proof[0]);
  const phones = proof.media?.every((media) => media.type === "phone") ? proof.media.slice(0, 3) : null;
  const shot = phones ? null : (proof.media?.find((media) => media.type !== "phone") ?? null);

  return (
    <div className="services">
      <ol className="service-list">
        {services.map((service, index) => (
          <li key={service.slug} data-hue={service.slug} data-current={service.slug === current}>
            <Link
              href={`/services/${service.path}`}
              onPointerEnter={() => setCurrent(service.slug)}
              onFocus={() => setCurrent(service.slug)}
            >
              <span className="meta service-n">0{index + 1}</span>
              <span className="service-main">
                <span className="service-title">{service.title}</span>
                <span className="service-promise">{service.promise}</span>
              </span>
              <span className="service-proof meta">
                {service.proof.slice(0, 3).map((slug) => getProject(slug).title).join(" · ")}
              </span>
              <span className="service-go" aria-hidden="true">
                →
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <aside className="service-preview" data-hue={active.slug} aria-hidden="true">
        {phones ? (
          <div className="service-phones phones" key={proof.slug}>
            {phones.map((phone) => (
              <Image key={phone.src} src={phone.src} alt="" width={phone.width} height={phone.height} sizes="(min-width: 960px) 11vw, 0px" />
            ))}
          </div>
        ) : null}
        {shot ? (
          <Image
            key={shot.src}
            className={shot.type === "pixel" ? "pixel" : undefined}
            src={shot.src}
            alt=""
            width={shot.width}
            height={shot.height}
            sizes="(min-width: 960px) 38vw, 0px"
          />
        ) : null}
        <p className="meta">
          <span className="hue">Proof:</span> {proof.title}. {proof.statusLabel}.
        </p>
      </aside>
    </div>
  );
}
