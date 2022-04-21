<?php

namespace Pimcore\Maintenance\Tasks;

use Pimcore\Maintenance\TaskInterface;
use Symfony\Component\Lock\Factory as LockFactory;
use Pimcore\Db;

class FullTextIndexOptimizeTask implements TaskInterface
{
    /** @var \Symfony\Component\Lock\LockInterface */
    private $lock;

    public function __construct(LockFactory $lockFactory)
    {
        $this->lock = $lockFactory->createLock(self::class, 86400 * 7, false);
    }

    /**
     * {@inheritdoc}
     */
    public function execute()
    {
        if ($this->lock->acquire(false)) {
            Db::get()->fetchAll('OPTIMIZE TABLE search_backend_data');
            Db::get()->fetchAll('OPTIMIZE TABLE email_log');
        }
    }
}
