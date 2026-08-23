import test from "node:test";
import assert from "node:assert/strict";
import {
  edges,
  getProject,
  neighbours,
  projects,
  projectsByDate,
  relatedProjects,
  researchProjects,
  statusLabel,
} from "../lib/projects";
import { domainProjects, domains } from "../lib/domains";

/**
 * The whole site is generated from `projects.ts`, so the failure mode that
 * matters is a project added with a typo in a `related` id or a duplicated
 * network coordinate: nothing crashes, an edge silently disappears, and the map
 * quietly stops being true. These are the invariants every view assumes.
 */

test("ids are unique", () => {
  const ids = projects.map((project) => project.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("ids are URL-safe, since each one is a route", () => {
  for (const project of projects) {
    assert.match(project.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, project.id);
  }
});

test("every related id resolves to a real project", () => {
  for (const project of projects) {
    for (const id of project.related) {
      assert.ok(getProject(id), `${project.id} -> ${id}`);
    }
    assert.ok(!project.related.includes(project.id), `${project.id} relates to itself`);
  }
});

test("relationships are symmetric", () => {
  // The graph treats `related` as undirected, so an asymmetric pair renders an
  // edge that only one of the two detail pages mentions.
  for (const project of projects) {
    for (const id of project.related) {
      const other = getProject(id);
      assert.ok(
        other?.related.includes(project.id),
        `${project.id} lists ${id}, but ${id} does not list it back`,
      );
    }
  }
});

test("no project is stranded", () => {
  for (const project of projects) {
    assert.ok(neighbours(project.id).size > 0, `${project.id} has no edges`);
  }
});

test("edges are de-duplicated", () => {
  const keys = edges.map((edge) => [edge.source, edge.target].sort().join("::"));
  assert.equal(new Set(keys).size, keys.length);
});

test("dates are sortable and ordered consistently", () => {
  for (const project of projects) {
    assert.match(project.start, /^\d{4}-\d{2}$/, project.id);
    if (project.end) {
      assert.match(project.end, /^\d{4}-\d{2}$/, project.id);
      assert.ok(project.end >= project.start, `${project.id} ends before it starts`);
    }
  }

  const starts = projectsByDate.map((project) => project.start);
  assert.deepEqual(starts, [...starts].sort());
});

test("an open-ended project has no end date, and vice versa", () => {
  for (const project of projects) {
    const openEnded = project.dateLabel.endsWith("Now");
    assert.equal(
      project.end === null,
      openEnded,
      `${project.id}: dateLabel "${project.dateLabel}" disagrees with end ${project.end}`,
    );
  }
});

test("the date label starts with the sortable start date", () => {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  for (const project of projects) {
    const [year, month] = project.start.split("-");
    const expected = `${months[Number(month) - 1]} ${year}`;
    assert.ok(
      project.dateLabel.startsWith(expected),
      `${project.id}: "${project.dateLabel}" does not start with "${expected}"`,
    );
  }
});

test("only archived projects are marked as possibly returning", () => {
  for (const project of projects.filter((p) => p.mayReturn)) {
    assert.ok(
      ["discontinued", "on-hold"].includes(project.status),
      `${project.id} is ${project.status} and cannot "may return"`,
    );
    assert.match(statusLabel(project), /May return$/);
  }
});

test("a project with no public destination has no link fields", () => {
  for (const project of projects) {
    if (project.status === "private" || project.status === "research") {
      assert.equal(project.url, undefined, `${project.id} must not publish a URL`);
    }
    if (project.url) {
      assert.match(project.url, /^https:\/\//, project.id);
      assert.ok(project.urlLabel, `${project.id} has a url but no label`);
    }
  }
});

test("every project carries the copy each view needs", () => {
  for (const project of projects) {
    assert.ok(project.short.length > 0 && project.short.length < 90, project.id);
    assert.ok(project.summary.length > 40, project.id);
    assert.ok(project.body.length >= 2, `${project.id} needs a real detail page`);
    assert.ok(project.tags.length >= 3, project.id);
    assert.ok(project.chapter.length > 0, project.id);
    assert.ok(project.typeLabel.length > 0, project.id);
  }
});

test("network coordinates are on-canvas and never collide", () => {
  const placed = projects.filter((project) => project.node);
  const seen = new Set<string>();

  for (const project of placed) {
    const node = project.node!;
    assert.ok(node.x > 0 && node.x < 1000, `${project.id} x`);
    assert.ok(node.y > 0 && node.y < 560, `${project.id} y`);
    const key = `${node.x}:${node.y}`;
    assert.ok(!seen.has(key), `${project.id} sits on top of another node`);
    seen.add(key);
  }

  // Anything drawn on the map must be reachable from the map.
  for (const edge of edges) {
    assert.ok(getProject(edge.source)?.node, edge.source);
    assert.ok(getProject(edge.target)?.node, edge.target);
  }
});

test("nodes are far enough apart to be separate tap targets", () => {
  const placed = projects.filter((project) => project.node);
  for (const a of placed) {
    for (const b of placed) {
      if (a.id >= b.id) continue;
      const distance = Math.hypot(a.node!.x - b.node!.x, a.node!.y - b.node!.y);
      assert.ok(distance > 90, `${a.id} and ${b.id} are ${Math.round(distance)} apart`);
    }
  }
});

test("relatedProjects resolves cleanly for every project", () => {
  for (const project of projects) {
    assert.equal(relatedProjects(project).length, project.related.length, project.id);
  }
});

test("the research section is not empty and holds no live product", () => {
  assert.ok(researchProjects.length >= 3);
  for (const project of researchProjects) {
    assert.notEqual(project.status, "active", `${project.id} is live`);
  }
});

test("every domain is backed by real work", () => {
  for (const domain of domains) {
    assert.ok(domain.projectIds.length > 0, domain.id);
    assert.equal(
      domainProjects(domain).length,
      domain.projectIds.length,
      `${domain.id} names a project that does not exist`,
    );
  }
});

test("every project appears somewhere in the domain index", () => {
  const claimed = new Set(domains.flatMap((domain) => domain.projectIds));
  for (const project of projects) {
    assert.ok(claimed.has(project.id), `${project.id} is in no domain`);
  }
});
