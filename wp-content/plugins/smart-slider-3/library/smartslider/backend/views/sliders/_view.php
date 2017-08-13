<?php


class N2SmartsliderBackendSlidersView extends N2ViewBase {

    public function getDashboardButtons() {

        $app        = N2Base::getApplication('smartslider');
        $accessEdit = N2Acl::canDo('smartslider_edit', $app->info);

        $buttons = '';
        if ($accessEdit) {

            $buttons .= N2Html::tag('a', array(
                'data-label' => n2_('Import slider'),
                'href'       => $app->router->createUrl(array('sliders/import')),
                'id'         => 'n2-ss-import-slider'
            ), N2Html::tag('i', array('class' => 'n2-i n2-i-a-import')));

        }
    


        return $buttons;
    }
} 