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

namespace Pimcore\Tool;

/**
 * @internal
 */
class Transliteration
{
    /**
     * @static
     *
     * @param string $value
     * @param string|null $language
     *
     * @return string
     */
    public static function toASCII($value, $language = null)
    {
        $transliterationId = '';
        if($language !== null && in_array($language.'-ASCII', transliterator_list_ids())) {
            $transliterationId = $language.'-ASCII; ';
        }
        $value = transliterator_transliterate($transliterationId.'Any-Latin; Latin-ASCII; [^\u001F-\u007f] remove', $value);
        $value = trim($value);

        return $value;
    }
}
