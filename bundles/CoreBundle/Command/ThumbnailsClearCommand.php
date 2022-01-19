<?php

/**
 * Pimcore
 *
 * This source file is available under two different licenses:
 * - GNU General Public License version 3 (GPLv3)
 * - Pimcore Commercial License (PCL)
 * Full copyright and license information is available in
 * LICENSE.md which is distributed with this source code.
 *
 *  @copyright  Copyright (c) Pimcore GmbH (http://www.pimcore.org)
 *  @license    http://www.pimcore.org/license     GPLv3 and PCL
 */

namespace Pimcore\Bundle\CoreBundle\Command;

use Pimcore\Console\AbstractCommand;
use Pimcore\Model\Asset;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

class ThumbnailsClearCommand extends AbstractCommand
{
    protected function configure()
    {
        $this
            ->setName('pimcore:thumbnails:clear')
            ->setDescription('Clear certain image or video thumbnails (temp. files)')
            ->addOption(
                'type',
                null,
                InputOption::VALUE_REQUIRED,
                'video or image'
            )
            ->addOption(
                'name',
                null,
                InputOption::VALUE_REQUIRED,
                'name of the thumbnail config of which the temp. files should be cleared'
            )
            ->addOption(
                'id',
                null,
                InputOption::VALUE_REQUIRED,
                'asset id'
            )
            ->addOption(
                'path',
                null,
                InputOption::VALUE_REQUIRED,
                'asset id'
            );
    }

    /**
     * @inheritDoc
     */
    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $possibleOptions = ['image', 'video'];
        if (!in_array($input->getOption('type'), $possibleOptions)) {
            $this->writeError(sprintf('Input option `type` must be one of %s', implode(',', $possibleOptions)));

            return 1;
        }

        if (!$input->getOption('name') && !$input->getOption('id')) {
            $this->writeError('Input option `name` or `id` + `path` is required');

            return 1;
        }

        if($input->getOption('name')) {
            $configClass = 'Pimcore\Model\Asset\\'.ucfirst($input->getOption('type')).'\Thumbnail\Config';
            /** @var Asset\Image\Thumbnail\Config|Asset\Video\Thumbnail\Config $thumbConfig */
            $thumbConfig = $configClass::getByName($input->getOption('name'));
            if (!$thumbConfig) {
                $this->writeError(sprintf('Unable to find %s thumbnail config with name: %s', $input->getOption('type'), $input->getOption('name')));

                return 1;
            }

            $thumbConfig->clearTempFiles();
        } else {
            $path = $input->getOption('path');
            if(!$path) {
                $asset = Asset::getById($input->getOption('id'));
                if(!$asset instanceof Asset) {
                    $this->writeError('Could not resolve asset path');

                    return 1;
                }
                $path = $asset->getImageThumbnailSavePath();
            }

            $directoryIterator = new \DirectoryIterator($path);
            $filterIterator = new \CallbackFilterIterator($directoryIterator, function (\SplFileInfo $fileInfo) use ($input) {
                return strpos($fileInfo->getFilename(), 'image-thumb__'.$input->getOption('id')) === 0;
            });
            /** @var \SplFileInfo $fileInfo */
            foreach ($filterIterator as $fileInfo) {
                recursiveDelete($fileInfo->getPathname());
            }
        }


        return 0;
    }
}
