import * as React from 'react';

import { Button, Card, CardContent, Grid, Typography } from '@mui/joy';
import LaunchIcon from '@mui/icons-material/Launch';

import { Link } from '~/common/components/Link';


export const beamReleaseDate = '2024-04-01T22:00:00Z';
export const beamBlogUrl = 'https://big-agi.com/blog/beam-multi-model-ai-reasoning/';

export const beamNewsCallout =
  <Card variant='solid' invertedColors>
    <CardContent sx={{ gap: 2 }}>
      <Typography level='title-lg'>
        Beam - just launched in 1.15
      </Typography>
      <Typography level='body-sm'>
        Beam is a world-first, multi-model AI chat modality that accelerates the discovery of superior solutions by leveraging the collective strengths of diverse LLMs.
        {/*Beam is a world-first, multi-model AI chat modality. By combining the strenghts of diverse LLMs, Beam allows you to find better answers, faster.*/}
      </Typography>
      <Grid container spacing={1}>
        <Grid xs={12} sm={7}>
          <Button
            fullWidth variant='soft' color='primary' endDecorator={<LaunchIcon />}
            component={Link} href={beamBlogUrl} noLinkStyle target='_blank'
          >
            Blog
          </Button>
        </Grid>
        <Grid xs={12} sm={5} sx={{ display: 'flex', flexAlign: 'center', justifyContent: 'center' }}>
          {/*<Button*/}
          {/*  fullWidth variant='plain' color='primary' endDecorator={<LaunchIcon />}*/}
          {/*  component={Link} href={Brand.URIs.OpenRepo + '/issues/new?template=roadmap-request.md&title=%5BSuggestion%5D'} noLinkStyle target='_blank'*/}
          {/*>*/}
          {/*  Suggest a Feature*/}
          {/*</Button>*/}
        </Grid>
      </Grid>
    </CardContent>
  </Card>;