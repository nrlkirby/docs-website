import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/react';
import { graphql } from 'gatsby';
import PageTitle from '../components/PageTitle';
import Timeline from '../components/Timeline';
import SEO from '../components/SEO';
import { Button, Icon, Layout, Link } from '@newrelic/gatsby-theme-newrelic';
import filter from 'unist-util-filter';
import { TYPES } from '../utils/constants';

const EXCERPT_LENGTH = 200;

const sortByVersion = (
  { frontmatter: { version: versionA } },
  { frontmatter: { version: versionB } }
) => {
  if (!versionA || !versionB) {
    return 0;
  }

  return (
    parseInt(versionB.replace(/\D/g, ''), 10) -
    parseInt(versionA.replace(/\D/g, ''), 10)
  );
};

const ReleaseNoteLandingPage = ({ data, pageContext, location }) => {
  const { slug, disableSwiftype, currentPage } = pageContext;
  const {
    allMdx: { nodes: posts },
    mdx: {
      frontmatter: { subject },
    },
  } = data;

  const now = useMemo(() => new Date(), []);
  const postsByDate = Array.from(
    posts
      .reduce((map, post) => {
        const { releaseDate } = post.frontmatter;
        const [monthOnly, year] = releaseDate.split(', ');
        const key =
          year === now.getFullYear().toString() ? monthOnly : releaseDate;

        return map.set(key, [...(map.get(key) || []), post]);
      }, new Map())
      .entries()
  );

  const title = `${subject} release notes`;

  if (typeof window !== 'undefined' && typeof newrelic === 'object') {
    window.newrelic.setCustomAttribute(
      'pageType',
      'Template/ReleaseNoteLanding'
    );
  }
  // Pagination button navigation logic
  const totalPages = Math.ceil(data.totalReleaseNotesPerAgent.totalCount / 10);
  const prevPage = currentPage <= 1 ? '' : currentPage - 1;
  const nextPage = currentPage + 1;
  const hasNextPage = nextPage <= totalPages;
  const hasPrevPage = prevPage >= 1;

  return (
    <>
      <SEO
        location={location}
        title={title}
        type={TYPES.LANDING_PAGE}
        disableSwiftype={disableSwiftype}
      />
      <PageTitle
        css={css`
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          gap: 0.5rem;

          @supports not (gap: 0.5rem) {
            > :first-child {
              margin-right: 0.5rem;
            }
          }
        `}
      >
        <span>{title}</span>

        <Link
          to={`${slug}/feed.xml`}
          css={css`
            display: flex;
            align-items: center;
            font-size: 0.875rem;
          `}
        >
          RSS
          <Icon
            name="fe-rss"
            css={css`
              margin-left: 0.25rem;
            `}
          />
        </Link>
      </PageTitle>
      <Layout.Content>
        <Timeline>
          {postsByDate.map(([date, posts], idx) => {
            const isLast = idx === postsByDate.length - 1;

            return (
              <Timeline.Item label={date} key={date}>
                {posts.sort(sortByVersion).map((post) => {
                  const excerpt = getBestGuessExcerpt(post.mdxAST);

                  return (
                    <div
                      key={post.version}
                      css={css`
                        margin-bottom: 2rem;

                        &:last-child {
                          margin-bottom: ${isLast ? 0 : '4rem'};
                        }
                      `}
                    >
                      <Link
                        to={post.fields.slug}
                        css={css`
                          display: inline-block;
                          font-size: 1.25rem;
                          margin-bottom: 0.5rem;
                        `}
                      >
                        {post.frontmatter.title
                          ? post.frontmatter.title
                          : `${subject} v${post.frontmatter.version}`}
                      </Link>
                      <p
                        css={css`
                          margin-bottom: 0;
                        `}
                      >
                        {excerpt.slice(0, EXCERPT_LENGTH)}
                        {excerpt.length > EXCERPT_LENGTH ? '…' : ''}
                      </p>
                    </div>
                  );
                })}
              </Timeline.Item>
            );
          })}
        </Timeline>
        <div
          css={css`
            display: flex;
            max-width: 760px;
            justify-content: center;
            align-items: flex-end;
            margin: 6rem auto 0;
            a {
              margin: 0 1rem 0;
              button {
                &:hover {
                  color: var(--brand-button-primary-accent-hover);
                  border-color: var(--brand-button-primary-accent-hover);
                }
              }
              text-decoration: none;
              &[disabled] {
                ${'' /* pointer-events: none;
                button {
                  border-color: grey;
                  color: grey;
                } */}
                display: none;
              }
              &.current {
                button {
                  border-color: var(--brand-button-primary-accent);
                }
              }
            }
          `}
        >
          <Link
            css={css``}
            disabled={!hasPrevPage}
            to={`${slug}${prevPage === 1 ? '/' : `/${prevPage}/`}`}
            // there is no url for agent-release-notes/1/
          >
            <Button variant={Button.VARIANT.OUTLINE}>
              <Icon name="fe-arrow-left" />
              Prev
            </Button>
          </Link>
          {/* prev, first, current of total, total, next  
          hide next and previous if disabled*/}
          {totalPages >= 2 && (
            <>
              {currentPage !== 1 && currentPage !== totalPages && (
                <Link
                  css={css``}
                  className={currentPage === 1 ? 'current' : ''}
                  to={slug}
                >
                  <Button variant={Button.VARIANT.OUTLINE}>1</Button>
                </Link>
              )}

              <Link css={css``} className="current" to={`${slug}/`}>
                <Button variant={Button.VARIANT.OUTLINE}>
                  {`Page ${currentPage} of ${totalPages}`}{' '}
                </Button>
              </Link>
              {currentPage !== totalPages && currentPage !== 1 && (
                <Link
                  css={css``}
                  className={currentPage === totalPages ? 'current' : ''}
                  to={`${slug}/${totalPages}/`}
                >
                  <Button variant={Button.VARIANT.OUTLINE}>
                    {totalPages}{' '}
                  </Button>
                </Link>
              )}
            </>
          )}

          <Link css={css``} disabled={!hasNextPage} to={`${slug}/${nextPage}/`}>
            <Button variant={Button.VARIANT.OUTLINE}>
              Next
              <Icon name="fe-arrow-right" />
            </Button>
          </Link>
        </div>
      </Layout.Content>
    </>
  );
};

ReleaseNoteLandingPage.propTypes = {
  data: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  pageContext: PropTypes.object.isRequired,
};

export const pageQuery = graphql`
  query(
    $slug: String!
    $subject: String!
    $locale: String
    $skip: Int
    $limit: Int
  ) {
    allMdx(
      filter: {
        frontmatter: { subject: { eq: $subject }, releaseDate: { ne: null } }
      }
      sort: { fields: [frontmatter___releaseDate], order: [DESC] }
      limit: $limit
      skip: $skip
    ) {
      nodes {
        mdxAST
        fields {
          slug
        }
        frontmatter {
          title
          version
          releaseDate(formatString: "MMMM D, YYYY")
        }
      }
    }
    mdx(fields: { slug: { eq: $slug } }) {
      frontmatter {
        subject
      }
    }
    totalReleaseNotesPerAgent: allMdx(
      filter: {
        frontmatter: { subject: { eq: $subject }, releaseDate: { ne: null } }
      }
    ) {
      totalCount
    }

    ...MainLayout_query
  }
`;

// copying in function from mdast-util-to-string so we can render list items with periods and spaces between
function toString(node) {
  const isList = node.type === 'list';
  return (
    (node &&
      (node.value ||
        node.alt ||
        node.title ||
        ('children' in node && all(node.children, isList)) ||
        ('length' in node && all(node, isList)))) ||
    ''
  );
}

function all(values, isList) {
  const result = [];
  const length = values.length;
  let index = -1;

  while (++index < length) {
    result[index] = toString(values[index]);
  }
  if (isList) {
    const strippedPeriodResults = result.map((listItem) => {
      if (listItem[listItem.length - 1] === '.') {
        return listItem.slice(0, -1);
      } else {
        return listItem;
      }
    });
    return strippedPeriodResults.join('. ');
  } else {
    return result.join('');
  }
}

const getBestGuessExcerpt = (mdxAST) => {
  const textTypes = [
    'paragraph',
    'list',
    'listItem',
    'text',
    'root',
    'link',
    'inlineCode',
  ];
  const ast = filter(mdxAST, (node) => textTypes.includes(node.type));

  return toString(
    filter(
      ast,
      (node, idx, parent) =>
        node.type === 'root' || parent.type !== 'root' || idx === 0
    )
  );
};

export default ReleaseNoteLandingPage;
