<?php
declare(strict_types=1);

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

namespace Pimcore\Bundle\SimpleBackendSearchBundle\Command;

use Blackbit\DataDirectorBundle\lib\Pim\Helper;
use Blackbit\DataDirectorBundle\model\PimcoreDbRepository;
use Exception;
use Pimcore;
use Pimcore\Bundle\SimpleBackendSearchBundle\Model\Search;
use Pimcore\Console\AbstractCommand;
use Pimcore\Logger;
use Pimcore\Model\Asset;
use Pimcore\Model\DataObject;
use Pimcore\Model\Element\Service;
use Pimcore\Model\Version;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * @internal
 */
#[AsCommand(
    name: 'pimcore:search-backend-reindex',
    description: 'Re-indexes the backend search of pimcore',
    aliases: ['search-backend-reindex']
)]
class SearchBackendReindexCommand extends AbstractCommand
{
    /**
     * @throws Exception
     */
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        // clear all data
        $db = \Pimcore\Db::get();

        $types = ['asset', 'document', 'object'];

        foreach ($types as $type) {
            $elementIds = array_column($db->fetchAllAssociative(
                'SELECT elements.id
                FROM `'.$type.'s` elements
                LEFT JOIN search_backend_data ON elements.id=search_backend_data.id AND search_backend_data.mainType=?
                WHERE (search_backend_data.id IS NULL OR search_backend_data.modificationDate < elements.modificationDate)',
                [$type]
            ), 'id');
            $elementsTotal = count($elementIds);

            foreach ($elementIds as $i => $elementId) {
                if ($i % 100 === 0) {
                    \Pimcore::collectGarbage();
                    Logger::info('Processing '.$type.': '.min($i + 100, count($elementIds)).'/'.$elementsTotal);
                }

                try {
                    $element = Service::getElementById($type, $elementId);
                    if (!$element instanceof Pimcore\Model\Element\ElementInterface) {
                        continue;
                    }
                    $searchEntry = new Pimcore\Bundle\SimpleBackendSearchBundle\Model\Search\Backend\Data();
                    $searchEntry->setDataFromElement($element);
                    $searchEntry->save();
                } catch (\Throwable $e) {
                    Logger::err((string)$e);
                }
            }
        }

        $db->executeQuery('OPTIMIZE TABLE search_backend_data;');

        return 0;
    }

    /**
     * @throws Exception
     */
    private function saveAsset(Asset $asset): void
    {
        Version::disable();
        $asset->markFieldDirty('modificationDate'); // prevent modificationDate from being changed
        $asset->save();
        Version::enable();
    }
}
